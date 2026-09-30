import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    name = Column(String(200), nullable=False)
    planet = Column(String(50), nullable=False, default="Moon")
    description = Column(Text, nullable=True)
    
    total_images = Column(Integer, default=0, nullable=False)
    crater_count = Column(Integer, default=0, nullable=False)
    non_crater_count = Column(Integer, default=0, nullable=False)
    
    storage_path = Column(String(512), nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    owner = relationship("User", back_populates="datasets")
