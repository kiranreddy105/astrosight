import os
import re
import uuid
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, UploadFile
from .config import settings

SAFE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}

# Magic bytes headers for common image formats
MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": ".jpg",
    b"\x89PNG\r\n\x1a\n": ".png",
    b"II*\x00": ".tif",      # Little-endian TIFF
    b"MM\x00*": ".tif"       # Big-endian TIFF
}

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename removing directory traversal characters, null bytes and dangerous shell characters."""
    filename = os.path.basename(filename)
    # Replace whitespace and unsafe characters
    filename = re.sub(r"[^\w\.-]", "_", filename)
    return filename[:200]

def validate_magic_bytes(header: bytes) -> bool:
    """Verifies that the first bytes of the file match authentic image headers."""
    for sig in MAGIC_SIGNATURES:
        if header.startswith(sig):
            return True
    return False

def validate_and_save_upload(file: UploadFile, user_id: str) -> Tuple[str, str, int, int, str]:
    """
    Validates image file content, verifies magic headers, prevents decompression bombs,
    and stores securely in user-isolated private storage directory outside public root.
    
    Returns: (file_id, safe_filename, width, height, absolute_storage_path)
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in SAFE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Permitted formats: PNG, JPG/JPEG, TIFF."
        )

    # Read first 16 bytes for magic bytes validation
    header = file.file.read(16)
    file.file.seek(0)
    if not validate_magic_bytes(header):
        raise HTTPException(
            status_code=400,
            detail="File content does not match authentic satellite image binary signatures."
        )

    # Prepare private isolated directory: data/uploads/{user_id}/
    user_upload_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "uploads", str(user_id))
    os.makedirs(user_upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    safe_filename = sanitize_filename(file.filename or f"image_{file_id}{ext}")
    storage_name = f"{file_id}_{safe_filename}"
    target_path = os.path.join(user_upload_dir, storage_name)

    # Prevent path traversal
    if not os.path.abspath(target_path).startswith(os.path.abspath(user_upload_dir)):
        raise HTTPException(status_code=400, detail="Path traversal attempt detected.")

    # Write file while enforcing size limit
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    written_bytes = 0
    with open(target_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024):  # 1MB chunks
            written_bytes += len(chunk)
            if written_bytes > max_bytes:
                buffer.close()
                if os.path.exists(target_path):
                    os.remove(target_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                )
            buffer.write(chunk)

    # Validate image decoding & prevent decompression bombs
    try:
        # Pillow DecompressionBombError threshold protection
        Image.MAX_IMAGE_PIXELS = settings.MAX_IMAGE_WIDTH_PX * settings.MAX_IMAGE_HEIGHT_PX
        with Image.open(target_path) as img:
            img.verify()
        
        # Re-open to read dimensions
        with Image.open(target_path) as img:
            w, h = img.size
            if w > settings.MAX_IMAGE_WIDTH_PX or h > settings.MAX_IMAGE_HEIGHT_PX:
                os.remove(target_path)
                raise HTTPException(
                    status_code=400,
                    detail=f"Image dimensions ({w}x{h}) exceed maximum allowable size ({settings.MAX_IMAGE_WIDTH_PX}x{settings.MAX_IMAGE_HEIGHT_PX})."
                )
    except Exception as e:
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupt satellite raster image: {str(e)}")

    return file_id, safe_filename, w, h, target_path
