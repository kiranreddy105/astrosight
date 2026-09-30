from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    planet: str
    description: Optional[str] = None
    total_images: int
    crater_count: int
    non_crater_count: int
    is_system: bool
    created_at: datetime

class DatasetCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    planet: str = Field("Moon", pattern="^(Moon|Mars)$")
    description: Optional[str] = Field(None, max_length=1000)
