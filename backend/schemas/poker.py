from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from utils.constants import VALID_VOTES, SessionStatus, UserRole


class PokerSessionCreate(BaseModel):
    """Schema pour créer une session"""
    title: str = Field(..., min_length=1, max_length=200, description="Titre de la session")
    description: Optional[str] = Field(None, max_length=1000, description="Description optionnelle")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Sprint 15 Planning",
                "description": "Estimation des user stories du sprint 15"
            }
        }


class PokerSessionResponse(BaseModel):
    """Schema de réponse pour une session"""
    id: int
    session_code: str
    title: str
    description: Optional[str]
    status: str
    is_revealed: bool
    creator_id: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class PokerVoteCreate(BaseModel):
    """Schema pour enregistrer un vote"""
    vote_value: str = Field(..., description="Valeur du vote")

    @validator('vote_value')
    def validate_vote(cls, v):
        if v not in VALID_VOTES:
            raise ValueError(f'Vote must be one of {VALID_VOTES}')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "vote_value": "5"
            }
        }


class PokerVoteResponse(BaseModel):
    """Schema de réponse pour un vote"""
    user: str
    value: str
    voted_at: str


class PokerRoundCreate(BaseModel):
    """Schema pour créer un nouveau round"""
    story_title: Optional[str] = Field(None, max_length=200, description="Titre de la story à estimer")

    class Config:
        json_schema_extra = {
            "example": {
                "story_title": "User Login Feature"
            }
        }


class PokerRoundComplete(BaseModel):
    """Schema pour clôturer un round avec l'estimation finale"""
    final_estimate: str = Field(..., description="Estimation finale convenue")

    @validator('final_estimate')
    def validate_estimate(cls, v):
        # Accepter toutes les valeurs de vote plus "custom"
        if v not in VALID_VOTES and not v.replace('.', '').isdigit():
            raise ValueError('Final estimate should be a valid vote value or number')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "final_estimate": "8"
            }
        }


class PokerRoundResponse(BaseModel):
    """Schema de réponse pour un round"""
    round_number: int
    story_title: Optional[str]
    final_estimate: Optional[str]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class PokerParticipantResponse(BaseModel):
    """Schema de réponse pour un participant"""
    username: str
    role: str
    has_voted: bool


class PokerSessionDetailResponse(BaseModel):
    """Schema de réponse détaillée pour une session avec tous ses éléments"""
    id: int
    session_code: str
    title: str
    description: Optional[str]
    status: str
    is_revealed: bool
    creator_id: int
    current_round: Optional[dict]
    votes: List[dict]
    participants: List[dict]
    rounds_history: List[dict]
    created_at: str