from pydantic import BaseModel
from typing import Optional
from datetime import date
from pydantic.config import ConfigDict

# Base schema for Project
class ProjectBase(BaseModel):
    name: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None
    progress: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_value: Optional[int] = None
    end_value: Optional[int] = None
    status: Optional[str] = None

# Schema for creating a Project
class ProjectCreate(ProjectBase):
    pass

# Schema for updating a Project
class ProjectUpdate(ProjectBase):
    pass

# Schema for reading a Project (includes id)
class ProjectRead(ProjectBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)