from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from database import Base


class WheelConfig(Base):
    __tablename__ = "wheel_configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    items = Column(Text)  # JSON array of items
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WheelResult(Base):
    __tablename__ = "wheel_results"
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("wheel_configs.id"))
    selected_item = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
