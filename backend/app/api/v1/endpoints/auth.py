import logging
import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from firebase_admin import auth, firestore

logger = logging.getLogger(__name__)

from app.schemas.auth import (
    SignUpRequest,
    LoginRequest,
    GoogleAuthRequest,
    ForgotPasswordRequest,
    AuthResponse,
    AuthUser,
)
from app.schemas.firestore import UserBase
from app.core.email import send_welcome_email
from app.core.config import settings
from app.core.security import create_access_token, validate_password
from app.core.deps import get_current_user

router = APIRouter()

IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1/accounts"


def get_db():
    return firestore.client()


def _build_auth_response(uid: str, email: str, name: str, role: str) -> AuthResponse:
    token = create_access_token(uid=uid, email=email, name=name, role=role)
    return AuthResponse(
        access_token=token,
        user=AuthUser(uid=uid, email=email, name=name, role=role),
    )


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest):
    """
    Create a new account.
    Password rules: min 8 chars, 1 uppercase, 1 number, 1 special character.
    """
    # Extra server-side password check (schema validator already runs but keeps things explicit)
    err = validate_password(request.password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    try:
        user_record = auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.name,
        )

        db = get_db()
        user_doc = UserBase(
            uid=user_record.uid,
            role="user",
            name=request.name,
            email=request.email,
        )
        db.collection("users").document(user_record.uid).set(user_doc.model_dump(mode="json"))

        # Send email verification via Firebase Identity Toolkit
        api_key = settings.FIREBASE_API_KEY
        if api_key:
            async with httpx.AsyncClient() as client:
                # Sign in to obtain a Firebase ID token needed for sendOobCode
                sign_in_resp = await client.post(
                    f"{IDENTITY_TOOLKIT_URL}:signInWithPassword?key={api_key}",
                    json={
                        "email": request.email,
                        "password": request.password,
                        "returnSecureToken": True,
                    },
                )
                if sign_in_resp.status_code == 200:
                    id_token = sign_in_resp.json().get("idToken")
                    if id_token:
                        oob_resp = await client.post(
                            f"{IDENTITY_TOOLKIT_URL}:sendOobCode?key={api_key}",
                            json={
                                "requestType": "VERIFY_EMAIL",
                                "idToken": id_token,
                            },
                        )
                        if oob_resp.status_code == 200:
                            logger.info("Verification email sent to %s", request.email)
                        else:
                            logger.warning("Failed to send verification email: %s", oob_resp.text)
                else:
                    logger.warning("Could not sign in to send verification email: %s", sign_in_resp.text)

        await send_welcome_email(name=request.name, to_email=request.email)

        return _build_auth_response(
            uid=user_record.uid,
            email=request.email,
            name=request.name,
            role="user",
        )

    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Sign in with email and password. Returns a JWT and basic user info.
    """
    api_key = settings.FIREBASE_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="FIREBASE_API_KEY not configured")

    url = f"{IDENTITY_TOOLKIT_URL}:signInWithPassword?key={api_key}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json={"email": request.email, "password": request.password, "returnSecureToken": True},
        )

    if resp.status_code != 200:
        msg = resp.json().get("error", {}).get("message", "Invalid email or password")
        raise HTTPException(status_code=401, detail=msg)

    firebase_data = resp.json()
    uid = firebase_data["localId"]

    # Fetch full profile from Firestore to get name and role
    db = get_db()
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        data = doc.to_dict()
        name = data.get("name", firebase_data.get("displayName", ""))
        role = data.get("role", "buyer")
    else:
        name = firebase_data.get("displayName", "")
        role = "buyer"

    return _build_auth_response(uid=uid, email=request.email, name=name, role=role)


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate using a Google ID token obtained from Google Identity Services
    on the frontend. Verifies the token with Google, then creates or updates
    the user in Firebase Auth and Firestore.
    """
    # Verify the Google ID token via Google's tokeninfo endpoint
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": request.credential},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    google_user = resp.json()

    # Verify the token was issued for this app (prevents token reuse from other apps)
    token_aud = google_user.get("aud", "")
    if settings.GOOGLE_CLIENT_ID and token_aud != settings.GOOGLE_CLIENT_ID:
        logger.warning(
            "Audience mismatch — token aud: %r  |  configured client id: %r",
            token_aud, settings.GOOGLE_CLIENT_ID,
        )
        raise HTTPException(status_code=400, detail="Google token audience mismatch")
    email: str = google_user.get("email", "")
    name: str = google_user.get("name", email.split("@")[0])
    photo_url: str = google_user.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google token")

    db = get_db()

    # Try to find existing Firebase Auth user by email
    try:
        user_record = auth.get_user_by_email(email)
        uid = user_record.uid
        # Update photo if available
        if photo_url:
            auth.update_user(uid, photo_url=photo_url)
    except auth.UserNotFoundError:
        # Create a new Firebase Auth user (no password — Google-linked)
        user_record = auth.create_user(
            email=email,
            display_name=name,
            photo_url=photo_url or None,
            email_verified=True,
        )
        uid = user_record.uid

    # Get or create Firestore user doc
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        data = doc.to_dict()
        role = data.get("role", "user")
        name = data.get("name", name)
    else:
        role = "user"
        db.collection("users").document(uid).set({
            "uid": uid,
            "role": role,
            "name": name,
            "email": email,
            "photoUrl": photo_url,
        })
        # New Google user — send welcome email
        await send_welcome_email(name=name, to_email=email)

    return _build_auth_response(uid=uid, email=email, name=name, role=role)


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Sends a password reset email via Firebase. Always returns success to
    avoid user enumeration — the email is only sent if an account exists.
    """
    api_key = settings.FIREBASE_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="FIREBASE_API_KEY not configured")

    url = f"{IDENTITY_TOOLKIT_URL}:sendOobCode?key={api_key}"
    async with httpx.AsyncClient() as client:
        await client.post(
            url,
            json={"requestType": "PASSWORD_RESET", "email": request.email},
        )

    # Always return success (don't leak whether the email exists)
    return {"message": "If an account exists for this email, a password reset link has been sent"}


# ---------------------------------------------------------------------------
# Get Current User
# ---------------------------------------------------------------------------

@router.get("/me", response_model=AuthUser)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's profile from the JWT.
    Requires Authorization: Bearer <token>.
    """
    return AuthUser(
        uid=current_user["sub"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
    )


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@router.post("/logout")
async def logout():
    """
    Stateless logout — the client removes the token from storage.
    A future improvement would store a token blacklist in Firestore.
    """
    return {"message": "Logged out successfully"}
