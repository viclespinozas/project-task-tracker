from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from enum import Enum
from ..db.session import Base

class ProjectStatus(str, Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    DONE = "Done"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    assignee = Column(String)
    priority = Column(String)
    progress = Column(Integer)
    start_date = Column(Date)
    end_date = Column(Date)
    start_value = Column(Integer)
    end_value = Column(Integer)
    status = Column(String)  # Using String to match the enum values

    # Relationship with tasks
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

    # past_due field is computed in service layer, not stored (as requested)
