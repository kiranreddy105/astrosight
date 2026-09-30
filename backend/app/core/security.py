import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
import bcrypt
import jwt
from .config import settings

def get_password_hash(password: str) -> str:
    """Hashes a password using bcrypt with standard work factor."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def validate_password_strength(password: str) -> Optional[str]:
    """
    Enforces practical, secure password policy:
    - Minimum 8 characters, maximum 128 characters
    - Must contain at least one letter and at least one number or symbol
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if len(password) > 128:
        return "Password must not exceed 128 characters."
    has_letter = any(c.isalpha() for c in password)
    has_digit_or_symbol = any(c.isdigit() or not c.isalnum() for c in password)
    if not (has_letter and has_digit_or_symbol):
        return "Password must contain letters and at least one number or symbol."
    return None

def create_access_token(subject: str, role: str = "user", expires_delta: Optional[timedelta] = None) -> str:
    """Creates a short-lived cryptographically signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str) -> str:
    """Creates a cryptographically secure random token string for session rotation."""
    return secrets.token_urlsafe(48)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT token expiration and signature."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None
