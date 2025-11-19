from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

def get_current_user(
        x_auth_user: str = Header(...),
        db: Session = Depends(get_db)
) -> User:
    """Authentification basique via header"""
    if not x_auth_user or len(x_auth_user.strip()) == 0:
        raise HTTPException(status_code=401, detail="Authentication required")

    username = x_auth_user.strip()
    user = db.query(User).filter(User.username == username).first()

    if not user:
        user = User(username=username)
        db.add(user)
        db.commit()
        db.refresh(user)

    return user