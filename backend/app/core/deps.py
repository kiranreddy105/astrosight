import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .security import decode_access_token
from ..models.user import User
from ..models.audit_log import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Authenticates request via Authorization Bearer token or HttpOnly cookie.
    Validates token signature, expiration, user active status, and account lockout.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Fallback to cookie if authorization header is omitted
    if not token:
        token = request.cookies.get("astrosight_access_token")

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    # Check lockout
    if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked due to multiple failed login attempts. Please try again later."
        )

    return user

def get_optional_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns authenticated user if valid token present, otherwise None without throwing 401."""
    if not token:
        token = request.cookies.get("astrosight_access_token")
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_active:
            return user
    except Exception:
        return None
    return None

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforces server-side administrator authorization."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return current_user

def log_security_event(
    db: Session,
    action: str,
    user_id: Optional[str],
    request: Request,
    details: Optional[dict] = None
):
    """Logs security and operational events safely with redacted sensitive data."""
    try:
        ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")[:250]
        
        # Redact any passwords or tokens in details
        sanitized = {}
        if details:
            for k, v in details.items():
                if "password" in k.lower() or "token" in k.lower() or "secret" in k.lower():
                    sanitized[k] = "[REDACTED]"
                else:
                    sanitized[k] = v

        audit = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip,
            user_agent=user_agent,
            details=json.dumps(sanitized) if sanitized else None
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-blocking logging failure
        print(f"Warning: Audit log error: {e}")
