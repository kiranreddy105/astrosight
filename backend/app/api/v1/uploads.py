import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.database import get_db
from ...core.deps import get_current_user, log_security_event
from ...core.file_security import validate_and_save_upload
from ...models.user import User

router = APIRouter(prefix="/files", tags=["Private File Storage & Uploads"])

@router.post("/upload")
def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Secure file upload:
    - Validates image magic bytes & MIME types
    - Checks file size limits (50MB) and pixel dimensions (anti-decompression bomb)
    - Isolates in user-specific private folder outside public web root
    """
    file_id, safe_name, w, h, target_path = validate_and_save_upload(file, current_user.id)
    
    file_size_mb = round(os.path.getsize(target_path) / (1024 * 1024), 2)
    log_security_event(db, "FILE_UPLOAD", current_user.id, request, {"filename": safe_name, "size_mb": file_size_mb})

    return {
        "file_id": file_id,
        "filename": safe_name,
        "width": w,
        "height": h,
        "size_mb": file_size_mb,
        "download_url": f"{settings.API_V1_STR}/files/{file_id}"
    }

@router.get("/{file_id}")
def get_private_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Authorized private file access:
    Ensures user can only download files stored in their own user directory.
    Prevents path traversal and Insecure Direct Object References (IDOR).
    """
    # 1. Search in user's private upload directory
    user_upload_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "uploads", str(current_user.id))
    if os.path.exists(user_upload_dir):
        for fname in os.listdir(user_upload_dir):
            if fname.startswith(f"{file_id}_"):
                full_path = os.path.join(user_upload_dir, fname)
                ext = os.path.splitext(fname)[1].lower()
                media_type = "image/png" if ext == ".png" else "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/tiff"
                return FileResponse(
                    full_path,
                    media_type=media_type,
                    headers={"X-Content-Type-Options": "nosniff"}
                )

    # 2. Check if admin
    if current_user.role == "admin":
        uploads_root = os.path.join(settings.PRIVATE_STORAGE_DIR, "uploads")
        if os.path.exists(uploads_root):
            for uid_dir in os.listdir(uploads_root):
                full_uid_dir = os.path.join(uploads_root, uid_dir)
                if os.path.isdir(full_uid_dir):
                    for fname in os.listdir(full_uid_dir):
                        if fname.startswith(f"{file_id}_"):
                            full_path = os.path.join(full_uid_dir, fname)
                            return FileResponse(full_path, headers={"X-Content-Type-Options": "nosniff"})

    # 3. Check if it's an annotated output file
    annotated_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "uploads", str(current_user.id))
    annotated_candidate = os.path.join(annotated_dir, f"annotated_{file_id}.jpg")
    if os.path.exists(annotated_candidate):
        return FileResponse(annotated_candidate, media_type="image/jpeg", headers={"X-Content-Type-Options": "nosniff"})

    raise HTTPException(status_code=404, detail="File not found or unauthorized access.")
