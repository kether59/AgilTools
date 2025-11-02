from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import secrets

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./agile_tools.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    poker_sessions = relationship("PokerSession", back_populates="creator")
    poker_votes = relationship("PokerVote", back_populates="user")

class PokerSession(Base):
    __tablename__ = "poker_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    is_revealed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    creator = relationship("User", back_populates="poker_sessions")
    votes = relationship("PokerVote", back_populates="session")

class PokerVote(Base):
    __tablename__ = "poker_votes"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("poker_sessions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    vote_value = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("PokerSession", back_populates="votes")
    user = relationship("User", back_populates="poker_votes")

class WheelConfig(Base):
    __tablename__ = "wheel_configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    items = Column(Text)  # JSON array of items
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class WheelResult(Base):
    __tablename__ = "wheel_results"
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("wheel_configs.id"))
    selected_item = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    username: str

class PokerSessionCreate(BaseModel):
    title: str
    description: Optional[str] = None

class PokerVoteCreate(BaseModel):
    vote_value: str

class WheelConfigCreate(BaseModel):
    name: str
    items: List[str]

class WheelResultCreate(BaseModel):
    config_id: int
    selected_item: str

# FastAPI app
app = FastAPI(title="Agile Tools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(x_auth_user: str = Header(...), db: Session = Depends(get_db)):
    if not x_auth_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = db.query(User).filter(User.username == x_auth_user).first()
    if not user:
        user = User(username=x_auth_user)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, session_code: str):
        await websocket.accept()
        if session_code not in self.active_connections:
            self.active_connections[session_code] = []
        self.active_connections[session_code].append(websocket)

    def disconnect(self, websocket: WebSocket, session_code: str):
        if session_code in self.active_connections:
            self.active_connections[session_code].remove(websocket)

    async def broadcast(self, message: dict, session_code: str):
        if session_code in self.active_connections:
            for connection in self.active_connections[session_code]:
                await connection.send_json(message)

manager = ConnectionManager()

# Routes
@app.get("/")
def read_root():
    return {"message": "Agile Tools API"}

@app.get("/api/user/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}

# Planning Poker endpoints
@app.post("/api/poker/sessions")
def create_poker_session(
    session_data: PokerSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session_code = secrets.token_urlsafe(8)
    session = PokerSession(
        session_code=session_code,
        title=session_data.title,
        description=session_data.description,
        creator_id=current_user.id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "session_code": session_code, "title": session.title}

@app.get("/api/poker/sessions/{session_code}")
def get_poker_session(session_code: str, db: Session = Depends(get_db)):
    session = db.query(PokerSession).filter(PokerSession.session_code == session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    votes = db.query(PokerVote).filter(PokerVote.session_id == session.id).all()
    vote_data = [{"user": v.user.username, "value": v.vote_value if session.is_revealed else "?"} for v in votes]
    
    return {
        "id": session.id,
        "title": session.title,
        "description": session.description,
        "is_revealed": session.is_revealed,
        "votes": vote_data
    }

@app.post("/api/poker/sessions/{session_code}/vote")
def cast_vote(
    session_code: str,
    vote_data: PokerVoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(PokerSession).filter(PokerSession.session_code == session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    existing_vote = db.query(PokerVote).filter(
        PokerVote.session_id == session.id,
        PokerVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        existing_vote.vote_value = vote_data.vote_value
    else:
        vote = PokerVote(session_id=session.id, user_id=current_user.id, vote_value=vote_data.vote_value)
        db.add(vote)
    
    db.commit()
    return {"message": "Vote recorded"}

@app.post("/api/poker/sessions/{session_code}/reveal")
def reveal_votes(
    session_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(PokerSession).filter(PokerSession.session_code == session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_revealed = True
    db.commit()
    return {"message": "Votes revealed"}

@app.post("/api/poker/sessions/{session_code}/reset")
def reset_votes(
    session_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(PokerSession).filter(PokerSession.session_code == session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.query(PokerVote).filter(PokerVote.session_id == session.id).delete()
    session.is_revealed = False
    db.commit()
    return {"message": "Votes reset"}

# Team Wheel endpoints
@app.post("/api/wheel/configs")
def create_wheel_config(
    config_data: WheelConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = WheelConfig(
        name=config_data.name,
        items=json.dumps(config_data.items),
        creator_id=current_user.id
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return {"id": config.id, "name": config.name, "items": json.loads(config.items)}

@app.get("/api/wheel/configs")
def get_wheel_configs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    configs = db.query(WheelConfig).filter(WheelConfig.creator_id == current_user.id).all()
    return [{"id": c.id, "name": c.name, "items": json.loads(c.items)} for c in configs]

@app.get("/api/wheel/configs/{config_id}")
def get_wheel_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(WheelConfig).filter(WheelConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return {"id": config.id, "name": config.name, "items": json.loads(config.items)}

@app.post("/api/wheel/results")
def save_wheel_result(
    result_data: WheelResultCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = WheelResult(
        config_id=result_data.config_id,
        selected_item=result_data.selected_item
    )
    db.add(result)
    db.commit()
    return {"message": "Result saved"}

@app.get("/api/wheel/configs/{config_id}/results")
def get_wheel_results(config_id: int, db: Session = Depends(get_db)):
    results = db.query(WheelResult).filter(WheelResult.config_id == config_id).order_by(WheelResult.created_at.desc()).limit(10).all()
    return [{"id": r.id, "selected_item": r.selected_item, "created_at": r.created_at.isoformat()} for r in results]

# WebSocket for real-time updates
@app.websocket("/ws/poker/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str):
    await manager.connect(websocket, session_code)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data, session_code)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_code)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)