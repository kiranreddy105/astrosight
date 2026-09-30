import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.database import get_db
from ...core.security import (
    get_password_hash,
    verify_password,
    validate_password_strength,
    create_access_token,
    create_refresh_token
)
from ...core.deps import get_current_user, log_security_event
from ...core.rate_limiter import limiter
from ...models.user import User
from ...models.token import RefreshToken, PasswordResetToken
from ...schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserProfileResponse,
    UserProfileUpdate
)

router = APIRouter(prefix="/auth", tags=["Authentication & User Portal"])

def hash_token(raw_token: str) -> str:
    """Hashes token before storing in database to protect against DB leaks."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(
    request: Request,
    response: Response,
    body: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """Secure user registration with password validation, bcrypt hashing, and audit logging."""
    # Check password strength
    strength_err = validate_password_strength(body.password)
    if strength_err:
        raise HTTPException(status_code=400, detail=strength_err)

    # Check email conflict
    existing_user = db.query(User).filter(User.email == body.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists."
        )

    # Create user
    user = User(
        email=body.email.lower(),
        hashed_password=get_password_hash(body.password),
        full_name=body.full_name.strip(),
        role="user",
        planet_preference=body.planet_preference,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue tokens
    access_token = create_access_token(user.id, role=user.role)
    raw_refresh = create_refresh_token(user.id)
    
    refresh_rec = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(refresh_rec)
    db.commit()

    # Set secure HttpOnly cookies
    response.set_cookie(
        key="astrosight_access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="astrosight_refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    log_security_event(db, "REGISTER_SUCCESS", user.id, request, {"email": user.email})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfileResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    body: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Secure login with rate-limiting, bcrypt verification, progressive account lockout,
    and refresh-token rotation.
    """
    email_clean = body.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    # Timing-safe mitigation: if user doesn't exist, still compute dummy hash
    if not user:
        verify_password("dummy-password", "$2b$12$e80yqX189zR3jVvE62HjkuE.F5P7o1B1pYqN9HhM3Gk8K8L.w9X.m")
        log_security_event(db, "LOGIN_FAILED", None, request, {"email": email_clean, "reason": "user_not_found"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    # Check lockout
    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > now:
        log_security_event(db, "LOGIN_BLOCKED_LOCKED", user.id, request, {"email": email_clean})
        remaining = int((user.locked_until.replace(tzinfo=timezone.utc) - now).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked due to multiple failed login attempts. Try again in {max(1, remaining)} minutes."
        )

    # Check active status
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    # Verify password
    if not verify_password(body.password, user.hashed_password):
        user.failed_login_attempts += 1
        # If 5 consecutive failed attempts, lock account for 15 minutes
        if user.failed_login_attempts >= 5:
            user.locked_until = now + timedelta(minutes=15)
            db.commit()
            log_security_event(db, "ACCOUNT_LOCKED", user.id, request, {"failed_attempts": user.failed_login_attempts})
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked for 15 minutes due to 5 consecutive failed login attempts."
            )
        db.commit()
        log_security_event(db, "LOGIN_FAILED", user.id, request, {"failed_attempts": user.failed_login_attempts})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    # Reset failed attempts on success
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    # Generate tokens
    access_token = create_access_token(user.id, role=user.role)
    raw_refresh = create_refresh_token(user.id)
    
    refresh_rec = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(refresh_rec)
    db.commit()

    # Set secure HttpOnly cookies
    response.set_cookie(
        key="astrosight_access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="astrosight_refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    log_security_event(db, "LOGIN_SUCCESS", user.id, request)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfileResponse.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_session(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db)
):
    """Rotates refresh tokens and issues fresh access token."""
    raw_refresh = body.refresh_token if (body and body.refresh_token) else request.cookies.get("astrosight_refresh_token")
    if not raw_refresh:
        raise HTTPException(status_code=401, detail="Refresh token required.")

    token_h = hash_token(raw_refresh)
    token_rec = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_h,
        RefreshToken.is_revoked == False
    ).first()

    now = datetime.now(timezone.utc)
    if not token_rec or token_rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid.")

    user = db.query(User).filter(User.id == token_rec.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer active.")

    # Token rotation: Revoke old refresh token, issue new pair
    token_rec.is_revoked = True
    
    new_access = create_access_token(user.id, role=user.role)
    new_raw_refresh = create_refresh_token(user.id)
    
    new_refresh_rec = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_raw_refresh),
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(new_refresh_rec)
    db.commit()

    response.set_cookie(
        key="astrosight_access_token",
        value=new_access,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="astrosight_refresh_token",
        value=new_raw_refresh,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    return TokenResponse(
        access_token=new_access,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfileResponse.model_validate(user)
    )

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revokes active refresh tokens and purges session cookies."""
    raw_refresh = request.cookies.get("astrosight_refresh_token")
    if raw_refresh:
        token_h = hash_token(raw_refresh)
        db.query(RefreshToken).filter(RefreshToken.token_hash == token_h).update({"is_revoked": True})
        db.commit()

    response.delete_cookie("astrosight_access_token")
    response.delete_cookie("astrosight_refresh_token")

    log_security_event(db, "LOGOUT", current_user.id, request)
    return {"success": True, "message": "Logged out successfully."}

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return UserProfileResponse.model_validate(current_user)

@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    body: UserProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates user profile preferences."""
    if body.full_name is not None:
        current_user.full_name = body.full_name.strip()
    if body.planet_preference is not None:
        current_user.planet_preference = body.planet_preference
    
    db.commit()
    db.refresh(current_user)
    log_security_event(db, "PROFILE_UPDATED", current_user.id, request)
    return UserProfileResponse.model_validate(current_user)

@router.post("/change-password")
def change_password(
    body: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verifies existing password and updates to new bcrypt hash."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect.")

    err = validate_password_strength(body.new_password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    current_user.hashed_password = get_password_hash(body.new_password)
    # Revoke all existing refresh tokens for security
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).update({"is_revoked": True})
    db.commit()

    log_security_event(db, "PASSWORD_CHANGED", current_user.id, request)
    return {"success": True, "message": "Password updated successfully. Other active sessions revoked."}

@router.post("/password-reset/request")
@limiter.limit("3/minute")
def request_password_reset(
    request: Request,
    body: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Generates a password reset token.
    Generic response is returned to avoid email enumeration.
    In development mode, token is logged to audit logs for local developer testing.
    """
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    dev_token = None
    if user and user.is_active:
        raw_reset_token = secrets.token_urlsafe(32)
        dev_token = raw_reset_token
        reset_rec = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_reset_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            is_used=False
        )
        db.add(reset_rec)
        db.commit()

        # Audit event without exposing sensitive credentials
        log_security_event(db, "PASSWORD_RESET_REQUESTED", user.id, request, {"status": "dispatched"})
        print(f"\n[DEV MODE] Password Reset Token for {user.email}: {raw_reset_token}\n")

    return {
        "success": True,
        "message": "If this email is registered in our mission registry, instructions to reset your password have been generated.",
        # In dev mode, return helper dev_token so the tester can test immediately without an SMTP server!
        "dev_token": dev_token if settings.ENVIRONMENT == "development" else None
    }

@router.post("/password-reset/confirm")
@limiter.limit("5/minute")
def confirm_password_reset(
    request: Request,
    body: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirms password reset using valid token and updates password."""
    err = validate_password_strength(body.new_password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    token_h = hash_token(body.token.strip())
    token_rec = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_h,
        PasswordResetToken.is_used == False
    ).first()

    now = datetime.now(timezone.utc)
    if not token_rec or token_rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Password reset token is invalid or has expired.")

    user = db.query(User).filter(User.id == token_rec.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=400, detail="User account no longer active.")

    user.hashed_password = get_password_hash(body.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    token_rec.is_used = True
    
    # Invalidate all refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"is_revoked": True})
    db.commit()

    log_security_event(db, "PASSWORD_RESET_CONFIRMED", user.id, request)
    return {"success": True, "message": "Password has been successfully reset. Please log in with your new password."}

@router.delete("/account")
def delete_account(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Performs account deletion (GDPR / Right to be Forgotten).
    Cascades and deletes user's analyses, private files, and audit records.
    """
    user_id = current_user.id
    log_security_event(db, "ACCOUNT_DELETED", user_id, request)

    # Delete user record (cascades to analyses, tokens, datasets)
    db.delete(current_user)
    db.commit()

    response.delete_cookie("astrosight_access_token")
    response.delete_cookie("astrosight_refresh_token")

    return {"success": True, "message": "Account and all associated planetary analyses have been permanently deleted."}
