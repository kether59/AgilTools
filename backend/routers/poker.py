from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from dependencies.auth import get_current_user
from models.user import User
from models.poker import PokerSession, PokerParticipant, PokerRound, PokerVote
from schemas.poker import (
    PokerSessionCreate,
    PokerVoteCreate,
    PokerRoundCreate,
    PokerRoundComplete
)
from services.poker_service import PokerService
from utils.websocket_manager import manager 

router = APIRouter(prefix="/api/poker", tags=["Planning Poker"])


@router.post("/sessions")
def create_poker_session(
        session_data: PokerSessionCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Créer une nouvelle session de planning poker
    - Crée automatiquement le premier round
    - Ajoute le créateur comme facilitateur
    """
    session = PokerService.create_session(
        db,
        session_data.title,
        session_data.description,
        current_user
    )

    return {
        "id": session.id,
        "session_code": session.session_code,
        "title": session.title,
        "description": session.description,
        "status": session.status
    }


@router.get("/sessions")
def get_my_sessions(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Récupérer toutes les sessions créées par l'utilisateur
    """
    sessions = db.query(PokerSession).filter(
        PokerSession.creator_id == current_user.id
    ).order_by(PokerSession.created_at.desc()).all()

    return [{
        "id": s.id,
        "session_code": s.session_code,
        "title": s.title,
        "description": s.description,
        "status": s.status,
        "created_at": s.created_at.isoformat(),
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        "rounds_count": len(s.rounds)
    } for s in sessions]


@router.get("/sessions/{session_code}")
def get_poker_session(
        session_code: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Récupérer les détails complets d'une session
    - Auto-join si l'utilisateur n'est pas déjà participant
    - Retourne les votes, participants, et historique
    """
    data = PokerService.get_session_details(db, session_code, current_user)

    session = data["session"]
    current_round = data["current_round"]
    votes = data["votes"]
    participants = data["participants"]
    completed_rounds = data["completed_rounds"]

    # Formater les votes
    vote_data = [{
        "user": v.user.username,
        "value": v.vote_value if session.is_revealed else "hidden",
        "voted_at": v.created_at.isoformat()
    } for v in votes]

    # Formater les participants
    participant_data = [{
        "username": p.user.username,
        "role": p.role,
        "has_voted": any(v.user_id == p.user_id for v in votes)
    } for p in participants]

    # Formater l'historique
    rounds_history = [{
        "round_number": r.round_number,
        "story_title": r.story_title,
        "final_estimate": r.final_estimate,
        "completed_at": r.completed_at.isoformat()
    } for r in completed_rounds]

    return {
        "id": session.id,
        "session_code": session.session_code,
        "title": session.title,
        "description": session.description,
        "status": session.status,
        "is_revealed": session.is_revealed,
        "creator_id": session.creator_id,
        "current_round": {
            "round_number": current_round.round_number if current_round else 0,
            "story_title": current_round.story_title if current_round else None
        } if current_round else None,
        "votes": vote_data,
        "participants": participant_data,
        "rounds_history": rounds_history,
        "created_at": session.created_at.isoformat()
    }


@router.post("/sessions/{session_code}/join")
def join_poker_session(
        session_code: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Rejoindre une session de planning poker
    - Ajoute l'utilisateur comme participant
    """
    session = PokerService.get_session(db, session_code)

    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    PokerService.join_session(db, session, current_user)

    return {"message": "Joined session successfully"}


@router.post("/sessions/{session_code}/vote")
async def cast_vote(
        session_code: str,
        vote_data: PokerVoteCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Enregistrer un vote pour le round actuel
    - Broadcast via WebSocket pour mise à jour temps réel
    """
    session = PokerService.get_session(db, session_code)
    PokerService.cast_vote(db, session, vote_data.vote_value, current_user)

    # Récupérer le round actuel pour le broadcast
    current_round = db.query(PokerRound).filter(
        PokerRound.session_id == session.id,
        PokerRound.completed_at == None
    ).order_by(PokerRound.round_number.desc()).first()

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "vote_cast",
        "username": current_user.username,
        "round_number": current_round.round_number if current_round else 0
    }, session_code)

    return {"message": "Vote recorded"}


@router.post("/sessions/{session_code}/reveal")
async def reveal_votes(
        session_code: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Révéler tous les votes du round actuel
    - Réservé au facilitateur uniquement
    """
    session = PokerService.get_session(db, session_code)
    PokerService.verify_facilitator(session, current_user)
    PokerService.reveal_votes(db, session)

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "votes_revealed"
    }, session_code)

    return {"message": "Votes revealed"}


@router.post("/sessions/{session_code}/reset")
async def reset_votes(
        session_code: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Réinitialiser les votes du round actuel
    - Réservé au facilitateur uniquement
    - Supprime tous les votes et masque les résultats
    """
    session = PokerService.get_session(db, session_code)
    PokerService.verify_facilitator(session, current_user)
    PokerService.reset_votes(db, session)

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "votes_reset"
    }, session_code)

    return {"message": "Votes reset"}


@router.post("/sessions/{session_code}/rounds")
async def start_new_round(
        session_code: str,
        round_data: PokerRoundCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Démarrer un nouveau round d'estimation
    - Réservé au facilitateur uniquement
    - Incrémente automatiquement le numéro de round
    """
    session = PokerService.get_session(db, session_code)
    PokerService.verify_facilitator(session, current_user)

    # Obtenir le numéro du prochain round
    last_round = db.query(PokerRound).filter(
        PokerRound.session_id == session.id
    ).order_by(PokerRound.round_number.desc()).first()

    next_round_number = (last_round.round_number + 1) if last_round else 1

    # Créer le nouveau round
    new_round = PokerRound(
        session_id=session.id,
        round_number=next_round_number,
        story_title=round_data.story_title or f"Round {next_round_number}"
    )
    db.add(new_round)

    # Masquer les votes et réinitialiser l'état
    session.is_revealed = False

    db.commit()
    db.refresh(new_round)

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "new_round",
        "round_number": new_round.round_number,
        "story_title": new_round.story_title
    }, session_code)

    return {
        "round_number": new_round.round_number,
        "story_title": new_round.story_title,
        "message": "New round started"
    }


@router.post("/sessions/{session_code}/rounds/{round_number}/complete")
async def complete_round(
        session_code: str,
        round_number: int,
        round_complete: PokerRoundComplete,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Clôturer un round avec l'estimation finale
    - Réservé au facilitateur uniquement
    - Sauvegarde l'estimation convenue par l'équipe
    """
    session = PokerService.get_session(db, session_code)
    PokerService.verify_facilitator(session, current_user)

    # Récupérer le round
    round_obj = db.query(PokerRound).filter(
        PokerRound.session_id == session.id,
        PokerRound.round_number == round_number
    ).first()

    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")

    # Clôturer le round
    round_obj.final_estimate = round_complete.final_estimate
    round_obj.completed_at = datetime.utcnow()
    db.commit()

    # Broadcast via WebSocket
    await manager.broadcast({
        "type": "round_completed",
        "round_number": round_number,
        "final_estimate": round_complete.final_estimate
    }, session_code)

    return {"message": "Round completed"}


@router.post("/sessions/{session_code}/complete")
def complete_session(
        session_code: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Terminer complètement une session
    - Réservé au facilitateur uniquement
    - Passe le statut à COMPLETED
    """
    session = PokerService.get_session(db, session_code)
    PokerService.verify_facilitator(session, current_user)

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    db.commit()

    return {"message": "Session completed"}


@router.delete("/sessions/{session_code}")
def delete_session(
        session_code: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Supprimer une session
    - Réservé au facilitateur uniquement
    - Supprime en cascade tous les votes, rounds, participants
    """
    session = PokerService.get_session(db, session_code)
    PokerService.verify_facilitator(session, current_user)

    db.delete(session)
    db.commit()

    return {"message": "Session deleted"}