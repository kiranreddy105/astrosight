from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class Point2D(BaseModel):
    x: float
    y: float

class SpatialCalcRequest(BaseModel):
    point_a: Point2D
    point_b: Point2D
    resolution_m_px: float = Field(10.0, gt=0.001, le=5000.0)
    unit: str = Field("kilometers", pattern="^(meters|kilometers|miles)$")

class SpatialCalcResponse(BaseModel):
    pixel_distance: float
    delta_x: float
    delta_y: float
    meters_per_pixel: float
    real_distance_m: float
    real_distance_km: float
    real_distance_mi: float
    formatted_distance: str
    bearing_deg: float
    formula: str
    unit: str
