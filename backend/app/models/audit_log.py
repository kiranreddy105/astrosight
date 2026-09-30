from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from ..core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)  # JSON-safe sanitized details
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
