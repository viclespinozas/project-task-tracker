from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..schemas.task import TaskCreate, TaskUpdate, TaskRead
from ..models.task import Task
from ..db.session import get_db
from ..services.task_service import compute_past_due

router = APIRouter()

@router.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    # Check if the referenced project exists
    from ..models.project import Project
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Compute past_due for the created task
    db_task.past_due = compute_past_due(db_task.due_date, db_task.status)
    return db_task

@router.get("/tasks", response_model=List[TaskRead])
def list_tasks(status: str = None, project_id: int = None, priority: str = None, db: Session = Depends(get_db)):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if priority:
        query = query.filter(Task.priority == priority)
    
    tasks = query.all()
    # Compute past_due for each task
    for task in tasks:
        task.past_due = compute_past_due(task.due_date, task.status)
    return tasks

@router.get("/tasks/{id}", response_model=TaskRead)
def get_task(id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Compute past_due for the task
    task.past_due = compute_past_due(task.due_date, task.status)
    return task

@router.patch("/tasks/{id}", response_model=TaskRead)
def update_task(id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Update only the fields that are provided (not None)
    for key, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    
    # Compute past_due for the updated task
    task.past_due = compute_past_due(task.due_date, task.status)
    return task

@router.delete("/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return None