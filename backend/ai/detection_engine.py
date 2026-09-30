import cv2
import numpy as np
import torch
import torch.nn.functional as F
from typing import List, Dict, Any, Tuple
from .crater_cnn import CraterNet
from .preprocessing import ImagePreprocessor

class CraterDetectionEngine:
    """
    Planetary Crater Detection Engine.
    Combines multi-scale circular morphological proposal generation with
    CraterNet CNN deep feature scoring and Non-Maximum Suppression (NMS).
    """
    def __init__(self, model: CraterNet, preprocessor: ImagePreprocessor):
        self.model = model
        self.preprocessor = preprocessor

    def _non_max_suppression(self, candidates: List[Dict[str, Any]], overlap_thresh: float = 0.4) -> List[Dict[str, Any]]:
        """
        Suppresses redundant overlapping crater detections.
        """
        if not candidates:
            return []

        # Sort candidates descending by confidence
        candidates = sorted(candidates, key=lambda c: c["confidence"], reverse=True)
        keep = []

        while candidates:
            current = candidates.pop(0)
            keep.append(current)

            filtered = []
            x1, y1, r1 = current["x"], current["y"], current["radius"]
            for cand in candidates:
                x2, y2, r2 = cand["x"], cand["y"], cand["radius"]
                
                # Center distance
                dist = np.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
                
                # Check overlap ratio
                min_r = min(r1, r2)
                max_r = max(r1, r2)
                
                # If distance is smaller than fraction of radius sum, suppress
                if dist < (r1 + r2) * 0.55 or (dist < max_r * 0.6 and min_r / max_r > 0.4):
                    continue
                filtered.append(cand)
            candidates = filtered

        return keep

    def _assess_crater_radial_morphology(self, gray: np.ndarray, x: int, y: int, r: int) -> float:
        """
        Computes the radial luminance asymmetry and central depression gradient
        typical of impact craters under oblique solar planetary lighting.
        Returns a score in [0.0, 1.0].
        """
        h, w = gray.shape
        x1, y1 = max(0, x - r), max(0, y - r)
        x2, y2 = min(w, x + r), min(h, y + r)
        if x2 - x1 < 8 or y2 - y1 < 8:
            return 0.1

        patch = gray[y1:y2, x1:x2].astype(np.float32)
        
        # Center region
        ch, cw = patch.shape
        cy, cx = ch // 2, cw // 2
        cr = max(2, min(ch, cw) // 4)
        
        y_indices, x_indices = np.ogrid[:ch, :cw]
        dist_from_center = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)
        
        center_mask = dist_from_center <= cr
        rim_mask = (dist_from_center > cr) & (dist_from_center <= min(ch, cw)//2)
        
        if not np.any(center_mask) or not np.any(rim_mask):
            return 0.5
            
        center_mean = np.mean(patch[center_mask])
        rim_std = np.std(patch[rim_mask])
        rim_max = np.max(patch[rim_mask])
        rim_min = np.min(patch[rim_mask])
        
        # Craters exhibit pronounced shadow/illuminated rim contrast
        contrast_span = (rim_max - rim_min) / (np.mean(patch) + 1e-5)
        rim_variation = min(1.0, rim_std / 35.0)
        contrast_score = min(1.0, contrast_span / 1.5)
        
        score = (rim_variation * 0.6) + (contrast_score * 0.4)
        return float(np.clip(score, 0.1, 0.99))

    def detect(
        self,
        bgr_image: np.ndarray,
        min_radius: int = 12,
        max_radius: int = 220,
        confidence_threshold: float = 0.70,
        max_detections: int = 40
    ) -> List[Dict[str, Any]]:
        """
        Performs full multi-scale crater detection on satellite image.
        Returns structured list of detected craters.
        """
        h, w = bgr_image.shape[:2]
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        
        # Preprocess with CLAHE for edge detection
        clahe_img = self.preprocessor.enhance_contrast(gray)
        blurred = cv2.GaussianBlur(clahe_img, (5, 5), 1.5)

        raw_candidates = []

        # 1. Multi-scale Hough Gradient Circles
        # Search at adaptive param levels to capture subtle & prominent craters
        param2_levels = [28, 38, 48]
        for p2 in param2_levels:
            circles = cv2.HoughCircles(
                blurred,
                cv2.HOUGH_GRADIENT,
                dp=1.2,
                minDist=int(min_radius * 1.8),
                param1=70,
                param2=p2,
                minRadius=min_radius,
                maxRadius=max_radius
            )
            if circles is not None:
                circles = np.uint16(np.around(circles))
                for c in circles[0, :]:
                    cx, cy, cr = int(c[0]), int(c[1]), int(c[2])
                    if cr > 0 and 0 <= cx < w and 0 <= cy < h:
                        raw_candidates.append((cx, cy, cr))

        # 2. Add blob / circular contour candidates from adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4
        )
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 150:
                (cx, cy), cr = cv2.minEnclosingCircle(cnt)
                cx, cy, cr = int(cx), int(cy), int(cr)
                if min_radius <= cr <= max_radius and 0 <= cx < w and 0 <= cy < h:
                    # Check circularity
                    perimeter = cv2.arcLength(cnt, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * (area / (perimeter * perimeter))
                        if circularity > 0.45:
                            raw_candidates.append((cx, cy, cr))

        # Deduplicate rough initial proposals
        unique_proposals = []
        for cx, cy, cr in raw_candidates:
            is_dupe = False
            for ux, uy, ur in unique_proposals:
                if np.sqrt((cx - ux)**2 + (cy - uy)**2) < max(cr, ur) * 0.4:
                    is_dupe = True
                    break
            if not is_dupe:
                unique_proposals.append((cx, cy, cr))

        # 3. Score each candidate through CNN feature representation + radial morphology
        scored_craters = []
        for cx, cy, cr in unique_proposals:
            # Crop patch around crater
            pad = int(cr * 1.25)
            x1, y1 = max(0, cx - pad), max(0, cy - pad)
            x2, y2 = min(w, cx + pad), min(h, cy + pad)
            
            patch = bgr_image[y1:y2, x1:x2]
            if patch.shape[0] < 10 or patch.shape[1] < 10:
                continue
                
            tensor = self.preprocessor.preprocess_patch_for_cnn(patch)
            
            with torch.no_grad():
                logits = self.model(tensor)
                probs = F.softmax(logits, dim=1).numpy()[0]
                cnn_crater_prob = float(probs[1])

            morph_score = self._assess_crater_radial_morphology(gray, cx, cy, cr)
            
            # Weighted hybrid score combining Deep Learning feature representation and photometric morphology
            final_conf = (cnn_crater_prob * 0.65) + (morph_score * 0.35)
            
            # Boost high-confidence agreement
            if cnn_crater_prob > 0.6 and morph_score > 0.6:
                final_conf = min(0.995, final_conf * 1.15)
                
            final_conf = float(np.clip(final_conf, 0.40, 0.994))

            if final_conf >= confidence_threshold:
                scored_craters.append({
                    "x": round(float(cx), 1),
                    "y": round(float(cy), 1),
                    "radius": round(float(cr), 1),
                    "diameter_px": round(float(cr * 2), 1),
                    "confidence": round(final_conf * 100, 2),
                    "cnn_prob": round(cnn_crater_prob * 100, 2),
                    "morph_score": round(morph_score * 100, 2)
                })

        # Apply Non-Maximum Suppression
        craters = self._non_max_suppression(scored_craters)
        craters = craters[:max_detections]

        # Assign systematic crater indices
        for i, c in enumerate(craters, start=1):
            c["index"] = i
            c["name"] = f"Crater #{i:02d}"

        return craters

    def annotate_image(
        self,
        bgr_image: np.ndarray,
        craters: List[Dict[str, Any]],
        show_boundaries: bool = True,
        show_center_points: bool = True,
        show_labels: bool = True,
        show_bounding_boxes: bool = False
    ) -> np.ndarray:
        """
        Renders NASA mission-control scientific HUD detection overlay on satellite image.
        """
        annotated = bgr_image.copy()
        
        # Modern aerospace color palette (BGR)
        CYAN = (255, 240, 0)       # Electric cyan / turquoise
        BLUE_GLOW = (255, 180, 50)  # Telemetry blue
        AMBER = (0, 190, 255)      # Amber alert
        WHITE = (255, 255, 255)
        BLACK = (10, 10, 16)
        
        for c in craters:
            cx, cy = int(round(c["x"])), int(round(c["y"]))
            r = int(round(c["radius"]))
            conf = c["confidence"]
            idx = c.get("index", 1)
            
            # 1. Bounding Circle Overlay
            if show_boundaries:
                # Thin glow outline
                cv2.circle(annotated, (cx, cy), r, (120, 80, 0), 3, cv2.LINE_AA)
                cv2.circle(annotated, (cx, cy), r, CYAN, 2, cv2.LINE_AA)

            # 2. Bounding Box (Corner reticles)
            if show_bounding_boxes:
                x1, y1 = max(0, cx - r), max(0, cy - r)
                x2, y2 = min(annotated.shape[1], cx + r), min(annotated.shape[0], cy + r)
                # Corner reticles
                ret_len = max(6, int(r * 0.3))
                # Top-left
                cv2.line(annotated, (x1, y1), (x1 + ret_len, y1), BLUE_GLOW, 2)
                cv2.line(annotated, (x1, y1), (x1, y1 + ret_len), BLUE_GLOW, 2)
                # Top-right
                cv2.line(annotated, (x2, y1), (x2 - ret_len, y1), BLUE_GLOW, 2)
                cv2.line(annotated, (x2, y1), (x2, y1 + ret_len), BLUE_GLOW, 2)
                # Bottom-left
                cv2.line(annotated, (x1, y2), (x1 + ret_len, y2), BLUE_GLOW, 2)
                cv2.line(annotated, (x1, y2), (x1, y2 - ret_len), BLUE_GLOW, 2)
                # Bottom-right
                cv2.line(annotated, (x2, y2), (x2 - ret_len, y2), BLUE_GLOW, 2)
                cv2.line(annotated, (x2, y2), (x2, y2 - ret_len), BLUE_GLOW, 2)

            # 3. Center Crosshairs Point
            if show_center_points:
                cv2.circle(annotated, (cx, cy), 3, WHITE, -1, cv2.LINE_AA)
                cv2.circle(annotated, (cx, cy), 5, CYAN, 1, cv2.LINE_AA)
                # Crosshair ticks
                ch_len = 8
                cv2.line(annotated, (cx - ch_len, cy), (cx + ch_len, cy), CYAN, 1, cv2.LINE_AA)
                cv2.line(annotated, (cx, cy - ch_len), (cx, cy + ch_len), CYAN, 1, cv2.LINE_AA)

            # 4. Aerospace HUD Label
            if show_labels:
                label_text = f"#{idx:02d} | {conf:.1f}%"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.42
                thickness = 1
                (lw, lh), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)
                
                label_x = cx - lw // 2
                label_y = max(lh + 6, cy - r - 8)
                
                # Tag background badge
                pad = 3
                cv2.rectangle(
                    annotated,
                    (label_x - pad, label_y - lh - pad),
                    (label_x + lw + pad, label_y + baseline + pad),
                    BLACK,
                    -1
                )
                cv2.rectangle(
                    annotated,
                    (label_x - pad, label_y - lh - pad),
                    (label_x + lw + pad, label_y + baseline + pad),
                    CYAN,
                    1
                )
                cv2.putText(
                    annotated,
                    label_text,
                    (label_x, label_y),
                    font,
                    font_scale,
                    WHITE,
                    thickness,
                    cv2.LINE_AA
                )

        return annotated
