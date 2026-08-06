from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from enum import Enum
from ..db.session import Base
from sqlalchemy import func

class TaskStatus(str, Enum):
    INBOX = "Inbox"
    WAITING = "Waiting"
    NEXT = "Next"
    DOING = "Doing"
    DONE = "Done"

class TaskPriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String)  # Using String to match the enum values
    assignee = Column(String)
    due_date = Column(Date)
    priority = Column(String)  # Using String to match the enum values
    description = Column(String)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    # Relationship with project
    project = relationship("Project", back_populates="tasks")
