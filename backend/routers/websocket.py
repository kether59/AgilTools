from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from sqlalchemy.orm import sessionmaker

from database import engine
from models.poker import PokerSession, PokerParticipant, PokerRound, PokerVote

from utils.websocket_manager import manager 

router = APIRouter(prefix="/ws", tags=["Web socket - database"])
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# WebSocket for real-time updates
@router.websocket("/poker/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str, username: str = "Anonymous"):
    db = SessionLocal()
    try:
        # Vérifier que la session existe
        session = db.query(PokerSession).filter(PokerSession.session_code == session_code).first()
        if not session:
            await websocket.close(code=4004, reason="Session not found")
            return

        await manager.connect(websocket, session_code, username)

        # Notifier les autres participants
        await manager.broadcast({
            "type": "user_joined",
            "username": username
        }, session_code)

        while True:
            data = await websocket.receive_json()
            # Echo des messages pour le chat ou autres interactions
            await manager.broadcast({
                "type": data.get("type", "message"),
                "username": username,
                "data": data
            }, session_code)

    except WebSocketDisconnect:
        manager.disconnect(session_code, username)
        await manager.broadcast({
            "type": "user_left",
            "username": username
        }, session_code)
    finally:
        db.close()