from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin.auth

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates a Firebase ID token.
    FastAPI's HTTPBearer automatically extracts the token from the
    Authorization: Bearer <token> header.
    """
    token = credentials.credentials
    try:
        decoded_token = firebase_admin.auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
