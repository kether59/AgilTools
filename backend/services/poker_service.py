import logging

from sqlalchemy.orm import Session
from fastapi import HTTPException
import secrets
from datetime import datetime

from models.poker import PokerSession, PokerParticipant, PokerRound, PokerVote
from models.user import User
from utils.constants import SessionStatus, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PokerService:


    @staticmethod
    def create_session(db: Session, title: str, description: str, user: User) -> PokerSession:
        """
        Créer une nouvelle session de planning poker
        - Génère un code unique
        - Ajoute le créateur comme facilitateur
        - Crée automatiquement le premier round
        """



        logger.info(f"user : {user}, title : {title}, description : {description} ")
        session_code = secrets.token_urlsafe(8)

        # Créer la session
        session = PokerSession(
            session_code=session_code,
            title=title,
            description=description,
            creator_id=user.id,
            status=SessionStatus.ACTIVE
        )
        db.add(session)
        db.flush()  # Pour obtenir l'ID sans commit

        # Ajouter le créateur comme facilitateur
        participant = PokerParticipant(
            session_id=session.id,
            user_id=user.id,
            role=UserRole.FACILITATOR
        )
        db.add(participant)

        # Créer automatiquement le premier round
        first_round = PokerRound(
            session_id=session.id,
            round_number=1,
            story_title="Round 1"
        )
        db.add(first_round)

        db.commit()
        db.refresh(session)

        logger.info(f" session : {session},  user : {user}, title : {title}, description : {description} ")

        return session

    @staticmethod
    def get_session(db: Session, session_code: str) -> PokerSession:
        """
        Récupérer une session par son code
        Lève une HTTPException 404 si introuvable
        """
        session = db.query(PokerSession).filter(
            PokerSession.session_code == session_code
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return session

    @staticmethod
    def get_session_details(db: Session, session_code: str, user: User) -> dict:
        """
        Récupérer tous les détails d'une session
        - Session
        - Round actuel
        - Votes du round actuel
        - Participants actifs
        - Historique des rounds complétés

        Auto-join l'utilisateur s'il n'est pas déjà participant
        """
        session = PokerService.get_session(db, session_code)

        # Auto-join
        PokerService.join_session(db, session, user)

        # Récupérer le round actif (dernier sans completed_at)
        current_round = db.query(PokerRound).filter(
            PokerRound.session_id == session.id,
            PokerRound.completed_at == None
        ).order_by(PokerRound.round_number.desc()).first()

        # Votes du round actuel
        votes = []
        if current_round:
            votes = db.query(PokerVote).filter(
                PokerVote.round_id == current_round.id
            ).all()

        # Participants actifs
        participants = db.query(PokerParticipant).filter(
            PokerParticipant.session_id == session.id,
            PokerParticipant.is_active == True
        ).all()

        # Historique des rounds complétés
        completed_rounds = db.query(PokerRound).filter(
            PokerRound.session_id == session.id,
            PokerRound.completed_at != None
        ).order_by(PokerRound.round_number.desc()).all()

        return {
            "session": session,
            "current_round": current_round,
            "votes": votes,
            "participants": participants,
            "completed_rounds": completed_rounds
        }

    @staticmethod
    def join_session(db: Session, session: PokerSession, user: User) -> None:
        """
        Ajouter un utilisateur comme participant à une session
        Si déjà participant, réactive sa participation
        """
        # Vérifier si déjà participant
        existing = db.query(PokerParticipant).filter(
            PokerParticipant.session_id == session.id,
            PokerParticipant.user_id == user.id
        ).first()

        if existing:
            # Réactiver si inactif
            existing.is_active = True
        else:
            # Créer nouveau participant
            participant = PokerParticipant(
                session_id=session.id,
                user_id=user.id,
                role=UserRole.PARTICIPANT
            )
            db.add(participant)

        db.commit()

    @staticmethod
    def cast_vote(db: Session, session: PokerSession, vote_value: str, user: User) -> None:
        """
        Enregistrer ou mettre à jour un vote
        - Vérifie que l'utilisateur est participant
        - Vérifie qu'il existe un round actif
        - Crée ou met à jour le vote
        """
        # Vérifier que l'utilisateur est participant actif
        participant = db.query(PokerParticipant).filter(
            PokerParticipant.session_id == session.id,
            PokerParticipant.user_id == user.id,
            PokerParticipant.is_active == True
        ).first()

        if not participant:
            raise HTTPException(
                status_code=403,
                detail="You are not a participant of this session"
            )

        # Récupérer le round actif
        current_round = db.query(PokerRound).filter(
            PokerRound.session_id == session.id,
            PokerRound.completed_at == None
        ).order_by(PokerRound.round_number.desc()).first()

        if not current_round:
            raise HTTPException(status_code=400, detail="No active round")

        # Vérifier si l'utilisateur a déjà voté
        existing_vote = db.query(PokerVote).filter(
            PokerVote.round_id == current_round.id,
            PokerVote.user_id == user.id
        ).first()

        if existing_vote:
            # Mettre à jour le vote existant
            existing_vote.vote_value = vote_value
            existing_vote.updated_at = datetime.utcnow()
        else:
            # Créer un nouveau vote
            vote = PokerVote(
                session_id=session.id,
                round_id=current_round.id,
                user_id=user.id,
                vote_value=vote_value
            )
            db.add(vote)

        db.commit()

    @staticmethod
    def verify_facilitator(session: PokerSession, user: User) -> None:
        """
        Vérifier que l'utilisateur est le créateur/facilitateur de la session
        Lève une HTTPException 403 si non autorisé
        """
        if session.creator_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the session creator can perform this action"
            )

    @staticmethod
    def reveal_votes(db: Session, session: PokerSession) -> None:
        """
        Révéler tous les votes du round actuel
        """
        session.is_revealed = True
        db.commit()

    @staticmethod
    def reset_votes(db: Session, session: PokerSession) -> None:
        """
        Réinitialiser les votes du round actuel
        - Supprime tous les votes
        - Masque les résultats
        """
        # Récupérer le round actif
        current_round = db.query(PokerRound).filter(
            PokerRound.session_id == session.id,
            PokerRound.completed_at == None
        ).order_by(PokerRound.round_number.desc()).first()

        if current_round:
            # Supprimer tous les votes de ce round
            db.query(PokerVote).filter(
                PokerVote.round_id == current_round.id
            ).delete()

        # Masquer les votes
        session.is_revealed = False
        db.commit()

    @staticmethod
    def get_user_sessions(db: Session, user: User) -> list:
        """
        Récupérer toutes les sessions créées par l'utilisateur
        """
        sessions = db.query(PokerSession).filter(
            PokerSession.creator_id == user.id
        ).order_by(PokerSession.created_at.desc()).all()

        return sessions