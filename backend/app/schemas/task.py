from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from pydantic.config import ConfigDict

# Base schema for Task
class TaskBase(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None

# Schema for creating a Task (past_due and updated_at are server-controlled)
class TaskCreate(TaskBase):
    pass

# Schema for updating a Task (past_due and updated_at are server-controlled)
class TaskUpdate(TaskBase):
    pass

# Schema for reading a Task (includes id, updated_at, and computed past_due field)
class TaskRead(TaskBase):
    id: int
    updated_at: datetime
    past_due: bool = Field(default=False)
    
    model_config = ConfigDict(from_attributes=True)
