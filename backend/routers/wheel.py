from fastapi import APIRouter, Depends, HTTPException
import json  # ✅ Import correct
from sqlalchemy.orm import Session
from datetime import datetime

from models.wheel import WheelConfig, WheelResult
from schemas.wheel import WheelConfigCreate, WheelResultCreate
from database import get_db
from dependencies.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/wheel", tags=["Wheel of decision"])

# Team Wheel endpoints
@router.post("/configs")
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

@router.get("/configs")
def get_wheel_configs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    configs = db.query(WheelConfig).filter(WheelConfig.creator_id == current_user.id).all()
    return [{"id": c.id, "name": c.name, "items": json.loads(c.items), "created_at": c.created_at.isoformat()} for c in configs]

@router.get("/configs/{config_id}")
def get_wheel_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(WheelConfig).filter(WheelConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return {"id": config.id, "name": config.name, "items": json.loads(config.items)}

@router.put("/configs/{config_id}")
def update_wheel_config(
        config_id: int,
        config_data: WheelConfigCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    config = db.query(WheelConfig).filter(
        WheelConfig.id == config_id,
        WheelConfig.creator_id == current_user.id
    ).first()

    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    config.name = config_data.name
    config.items = json.dumps(config_data.items)
    config.updated_at = datetime.utcnow()
    db.commit()

    return {"id": config.id, "name": config.name, "items": json.loads(config.items)}

@router.delete("/configs/{config_id}")
def delete_wheel_config(
        config_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    config = db.query(WheelConfig).filter(
        WheelConfig.id == config_id,
        WheelConfig.creator_id == current_user.id
    ).first()

    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    db.delete(config)
    db.commit()

    return {"message": "Config deleted"}

@router.post("/results")
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

@router.get("/configs/{config_id}/results")
def get_wheel_results(config_id: int, db: Session = Depends(get_db)):
    results = db.query(WheelResult).filter(
        WheelResult.config_id == config_id
    ).order_by(WheelResult.created_at.desc()).limit(20).all()
    return [{"id": r.id, "selected_item": r.selected_item, "created_at": r.created_at.isoformat()} for r in results]
