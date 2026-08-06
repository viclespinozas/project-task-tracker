from pydantic import BaseModel, Field, validator
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
    
    @validator('progress')
    def progress_must_be_between_0_and_100(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Progress must be between 0 and 100')
        return v
    
    @validator('end_date')
    def end_date_must_not_be_before_start_date(cls, v, values):
        if v is not None and 'start_date' in values and values['start_date'] is not None and v < values['start_date']:
            raise ValueError('End date must not be before start date')
        return v

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