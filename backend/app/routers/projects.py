from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectRead
from ..models.project import Project
from ..db.session import get_db

router = APIRouter()

@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/projects", response_model=List[ProjectRead])
def list_projects(status: str = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    return query.all()

@router.get("/projects/{id}", response_model=ProjectRead)
def get_project(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

@router.patch("/projects/{id}", response_model=ProjectRead)
def update_project(id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Update only the fields that are provided (not None)
    for key, value in project_update.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None