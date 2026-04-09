import re
from pydantic import BaseModel, EmailStr, Field, field_validator


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>/?\\|`~]', v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID token from Google Identity Services")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class AuthUser(BaseModel):
    uid: str
    email: str
    name: str
    role: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser


# Kept for backward compatibility
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
