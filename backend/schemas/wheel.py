from pydantic import BaseModel, Field, validator
from typing import List

class WheelConfigCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    items: List[str] = Field(..., min_items=2, max_items=50)

    @validator('items')
    def validate_items(cls, v):
        if len(set(v)) != len(v):
            raise ValueError('Items must be unique')
        return v

class WheelResultCreate(BaseModel):
    config_id: int
    selected_item: str