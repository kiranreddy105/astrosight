import cv2
import numpy as np
import torch
from typing import Tuple, Dict, Any

class ImagePreprocessor:
    """
    Modular planetary image preprocessing pipeline for satellite imagery (LROC / HiRISE).
    Includes noise suppression, adaptive contrast enhancement, and tensor normalization.
    """
    def __init__(
        self,
        target_size: Tuple[int, int] = (128, 128),
        apply_clahe: bool = True,
        apply_denoise: bool = True,
        clip_limit: float = 2.5,
        tile_grid_size: Tuple[int, int] = (8, 8),
        blur_kernel_size: int = 3
    ):
        self.target_size = target_size
        self.apply_clahe = apply_clahe
        self.apply_denoise = apply_denoise
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size
        self.blur_kernel_size = blur_kernel_size

    def enhance_contrast(self, img_gray: np.ndarray) -> np.ndarray:
        """Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) to reveal faint crater rims."""
        clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=self.tile_grid_size)
        return clahe.apply(img_gray)

    def reduce_noise(self, img_gray: np.ndarray) -> np.ndarray:
        """Applies Gaussian smoothing to attenuate high-frequency planetary imaging sensor noise."""
        k = self.blur_kernel_size if self.blur_kernel_size % 2 == 1 else self.blur_kernel_size + 1
        return cv2.GaussianBlur(img_gray, (k, k), 0)

    def preprocess_patch_for_cnn(self, patch: np.ndarray) -> torch.Tensor:
        """
        Preprocesses a sub-region (patch) into a normalized tensor ready for CraterNet forward pass.
        Returns tensor of shape [1, 3, target_size[0], target_size[1]].
        """
        if len(patch.shape) == 3 and patch.shape[2] == 3:
            gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        elif len(patch.shape) == 3 and patch.shape[2] == 4:
            gray = cv2.cvtColor(patch, cv2.COLOR_BGRA2GRAY)
        else:
            gray = patch.copy()

        if self.apply_denoise:
            gray = self.reduce_noise(gray)
        if self.apply_clahe:
            gray = self.enhance_contrast(gray)

        resized = cv2.resize(gray, self.target_size, interpolation=cv2.INTER_AREA)
        
        # Standardize planetary surface photometric channels
        norm_img = resized.astype(np.float32) / 255.0
        
        # Expand to 3-channel input tensor
        rgb_tensor = np.stack([norm_img, norm_img, norm_img], axis=0) # shape (3, H, W)
        tensor = torch.from_numpy(rgb_tensor).unsqueeze(0) # shape (1, 3, H, W)
        return tensor

    def process_full_image(self, bgr_image: np.ndarray, config: Dict[str, Any] = None) -> np.ndarray:
        """
        Processes a full satellite frame with specified enhancements.
        Returns enhanced BGR image.
        """
        if config is None:
            config = {}
            
        use_clahe = config.get("apply_clahe", self.apply_clahe)
        use_denoise = config.get("apply_denoise", self.apply_denoise)
        
        if len(bgr_image.shape) == 2:
            gray = bgr_image
            bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        else:
            gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
            bgr = bgr_image.copy()

        processed_gray = gray
        if use_denoise:
            processed_gray = self.reduce_noise(processed_gray)
        if use_clahe:
            processed_gray = self.enhance_contrast(processed_gray)
            
        # Return 3-channel representation
        return cv2.cvtColor(processed_gray, cv2.COLOR_GRAY2BGR)
