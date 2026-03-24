import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from firebase_admin import auth, firestore

from app.schemas.auth import LoginRequest, SignUpRequest, ForgotPasswordRequest, Token
from app.schemas.firestore import UserBase, ArtisanProfileBase
from app.core.config import settings

router = APIRouter()

# Firebase Identity Toolkit API URL for REST operations
IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1/accounts"

def get_firestore_client():
    """Lazy initialization of Firestore client to avoid import-time errors."""
    return firestore.client()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest):
    """
    Registers a new user in Firebase Auth and creates their profile in Firestore.
    """
    if request.role not in ["buyer", "artisan"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'buyer' or 'artisan'"
        )

    try:
        # 1. Create user in Firebase Auth
        user_record = auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.name
        )
        
        # 2. Add custom claims for role
        auth.set_custom_user_claims(user_record.uid, {"role": request.role})

        # 3. Create document in 'users' collection
        user_doc = UserBase(
            uid=user_record.uid,
            role=request.role,
            name=request.name,
            email=request.email
        )
        get_firestore_client().collection("users").document(user_record.uid).set(user_doc.model_dump(mode='json'))

        # 4. If artisan, create empty document in 'artisans' collection
        if request.role == "artisan":
            artisan_doc = ArtisanProfileBase(
                artisanId=user_record.uid,
                craftType="Not Specified", # Default
                region="Not Specified"    # Default
            )
            get_firestore_client().collection("artisans").document(user_record.uid).set(artisan_doc.model_dump(mode='json'))

        return {"uid": user_record.uid, "message": "User created successfully"}

    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    """
    Logs in a user using Firebase REST API and returns an ID token.
    Requires FIREBASE_API_KEY in environment variables.
    """
    api_key = getattr(settings, "FIREBASE_API_KEY", None)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FIREBASE_API_KEY not configured on server"
        )

    url = f"{IDENTITY_TOOLKIT_URL}:signInWithPassword?key={api_key}"
    payload = {
        "email": request.email,
        "password": request.password,
        "returnSecureToken": True
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        
        if response.status_code != 200:
            error_msg = response.json().get("error", {}).get("message", "Authentication failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_msg
            )
            
        data = response.json()
        return Token(access_token=data["idToken"])

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Sends a password reset email using Firebase REST API.
    """
    api_key = getattr(settings, "FIREBASE_API_KEY", None)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FIREBASE_API_KEY not configured on server"
        )

    url = f"{IDENTITY_TOOLKIT_URL}:sendOobCode?key={api_key}"
    payload = {
        "requestType": "PASSWORD_RESET",
        "email": request.email
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        
        if response.status_code != 200:
            error_msg = response.json().get("error", {}).get("message", "Failed to send reset email")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
            
        return {"message": "Password reset email sent"}
