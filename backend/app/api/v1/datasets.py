from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.deps import get_current_user, log_security_event
from ...models.user import User
from ...models.dataset import DatasetRecord
from ...schemas.dataset import DatasetResponse, DatasetCreateRequest

router = APIRouter(prefix="/datasets", tags=["Datasets Management"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns system planetary benchmark datasets and user-owned private datasets.
    Users can only see system benchmarks + their own custom datasets.
    """
    datasets = db.query(DatasetRecord).filter(
        (DatasetRecord.is_system == True) | (DatasetRecord.user_id == current_user.id)
    ).order_by(DatasetRecord.created_at.desc()).all()
    
    return [DatasetResponse.model_validate(d) for d in datasets]

@router.post("", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def create_user_dataset(
    body: DatasetCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new private user-owned planetary dataset catalog entry.
    User data is strictly isolated and never silently added to model training.
    """
    ds = DatasetRecord(
        user_id=current_user.id,
        name=body.name.strip(),
        planet=body.planet,
        description=body.description,
        total_images=0,
        crater_count=0,
        non_crater_count=0,
        is_system=False
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)

    log_security_event(db, "DATASET_CREATED", current_user.id, request, {"dataset_id": ds.id, "name": ds.name})
    return DatasetResponse.model_validate(ds)
