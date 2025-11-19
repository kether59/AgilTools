from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from utils.constants import SessionStatus, UserRole


class PokerSession(Base):
    __tablename__ = "poker_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE)
    is_revealed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    creator = relationship("User", back_populates="poker_sessions")
    votes = relationship("PokerVote", back_populates="session", cascade="all, delete-orphan")
    participants = relationship("PokerParticipant", back_populates="session", cascade="all, delete-orphan")
    rounds = relationship("PokerRound", back_populates="session", cascade="all, delete-orphan")

class PokerParticipant(Base):
    __tablename__ = "poker_participants"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("poker_sessions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(SQLEnum(UserRole), default=UserRole.PARTICIPANT)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    session = relationship("PokerSession", back_populates="participants")
    user = relationship("User", back_populates="poker_participants")

class PokerRound(Base):
    __tablename__ = "poker_rounds"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("poker_sessions.id"))
    round_number = Column(Integer)
    story_title = Column(String, nullable=True)
    final_estimate = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    session = relationship("PokerSession", back_populates="rounds")
    votes = relationship("PokerVote", back_populates="round", cascade="all, delete-orphan")

class PokerVote(Base):
    __tablename__ = "poker_votes"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("poker_sessions.id"))
    round_id = Column(Integer, ForeignKey("poker_rounds.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vote_value = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("PokerSession", back_populates="votes")
    round = relationship("PokerRound", back_populates="votes")
    user = relationship("User", back_populates="poker_votes")