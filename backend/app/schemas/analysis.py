from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class DetectedCraterSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    index: Optional[int] = None
    crater_index: Optional[int] = None
    x: float
    y: float
    radius: float
    confidence: float
    diameter_px: Optional[float] = None
    cnn_prob: Optional[float] = None
    morph_score: Optional[float] = None

    def model_post_init(self, __context: Any) -> None:
        if self.index is None and self.crater_index is not None:
            self.index = self.crater_index
        elif self.crater_index is None and self.index is not None:
            self.crater_index = self.index
        if self.diameter_px is None:
            self.diameter_px = round(self.radius * 2.0, 2)

class SpatialMeasurementSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    crater_a_index: int
    crater_b_index: int
    crater_a_x: float
    crater_a_y: float
    crater_b_x: float
    crater_b_y: float
    pixel_distance: float
    real_distance_m: float
    real_distance_km: float
    real_distance_mi: float
    bearing_deg: Optional[float] = None

class AnalysisCreateRequest(BaseModel):
    file_id: str
    filename: str
    planet: str = Field("Moon", pattern="^(Moon|Mars)$")
    analysis_mode: str = Field("Full Analysis", pattern="^(Full Analysis|Crater Detection|Crater Classification|Spatial Analysis)$")
    resolution_m_px: float = Field(10.0, gt=0.01, le=1000.0)
    apply_clahe: bool = True
    apply_denoise: bool = True
    confidence_threshold: float = Field(0.60, ge=0.30, le=0.99)
    show_boundaries: bool = True
    show_center_points: bool = True
    show_labels: bool = True
    show_bounding_boxes: bool = False

class AnalysisResponse(BaseModel):
    id: str
    filename: str
    planet: str
    analysis_mode: str
    resolution_m_px: float
    processing_time_ms: float
    crater_count: int
    average_confidence: float
    classification_result: Optional[str] = None
    classification_confidence: Optional[float] = None
    crater_density_per_km2: Optional[float] = None
    centroid_x: Optional[float] = None
    centroid_y: Optional[float] = None
    is_demo: bool
    created_at: datetime
    craters: List[DetectedCraterSchema] = []
    measurements: List[SpatialMeasurementSchema] = []
    image_url: str
    annotated_image_url: Optional[str] = None
    report_download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AnalysisListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    planet: str
    crater_count: int
    average_confidence: float
    resolution_m_px: float
    processing_time_ms: float
    is_demo: bool
    created_at: datetime

class AnalysisListResponse(BaseModel):
    items: List[AnalysisListItem]
    total: int
    page: int
    size: int
    total_pages: int
