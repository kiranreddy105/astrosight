import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Filesystem & Display Metadata
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    planet = Column(String(50), nullable=False, default="Moon")
    
    # Private storage relative paths (not public URLs!)
    storage_path = Column(String(512), nullable=False)
    annotated_path = Column(String(512), nullable=True)
    report_path = Column(String(512), nullable=True)
    
    # Scientific Results
    crater_count = Column(Integer, default=0, nullable=False)
    average_confidence = Column(Float, default=0.0, nullable=False)
    resolution_m_px = Column(Float, default=10.0, nullable=False)
    processing_time_ms = Column(Float, default=0.0, nullable=False)
    analysis_mode = Column(String(50), default="Full Analysis", nullable=False)
    
    classification_result = Column(String(50), nullable=True)
    classification_confidence = Column(Float, nullable=True)
    crater_density_per_km2 = Column(Float, default=0.0, nullable=True)
    centroid_x = Column(Float, nullable=True)
    centroid_y = Column(Float, nullable=True)
    
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    owner = relationship("User", back_populates="analyses")
    craters = relationship("DetectedCrater", back_populates="analysis", cascade="all, delete-orphan", order_by="DetectedCrater.crater_index")
    measurements = relationship("SpatialMeasurement", back_populates="analysis", cascade="all, delete-orphan")

class DetectedCrater(Base):
    __tablename__ = "detected_craters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    crater_index = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    radius = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    cnn_prob = Column(Float, nullable=True)
    morph_score = Column(Float, nullable=True)

    analysis = relationship("Analysis", back_populates="craters")

    @property
    def index(self) -> int:
        return self.crater_index

    @property
    def diameter_px(self) -> float:
        return self.radius * 2.0

class SpatialMeasurement(Base):
    __tablename__ = "spatial_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    crater_a_index = Column(Integer, nullable=False)
    crater_b_index = Column(Integer, nullable=False)
    crater_a_x = Column(Float, nullable=False)
    crater_a_y = Column(Float, nullable=False)
    crater_b_x = Column(Float, nullable=False)
    crater_b_y = Column(Float, nullable=False)
    pixel_distance = Column(Float, nullable=False)
    real_distance_m = Column(Float, nullable=False)
    real_distance_km = Column(Float, nullable=False)
    real_distance_mi = Column(Float, nullable=False)
    bearing_deg = Column(Float, nullable=True)

    analysis = relationship("Analysis", back_populates="measurements")
