#!/usr/bin/env python3
"""
Seed script to populate the database with realistic test data.
This script creates Projects and Tasks covering all status and priority values,
including at least one genuinely past-due task.
"""

import os
import sys
import datetime

# Add the current directory to Python path so we can import from it
sys.path.insert(0, os.path.dirname(__file__))

# Direct database connection approach
from sqlalchemy import create_engine, Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Set up database connection using the same URL as in .env
DATABASE_URL = "sqlite:///../../test.db"

engine = create_engine(DATABASE_URL)
Base = declarative_base()

# Define models directly to match the existing schema
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String)
    priority = Column(String)
    project_id = Column(Integer, ForeignKey("projects.id"))
    due_date = Column(Date)

def seed_database():
    """Seed the database with realistic test data."""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # Clear existing data (optional, comment out if you want to preserve existing data)
        # db.query(Task).delete()
        # db.query(Project).delete()
        
        # Create Projects with proper status values
        projects = [
            Project(
                name="Website Redesign",
                status="Not Started"
            ),
            Project(
                name="Mobile App Development",
                status="In Progress"
            ),
            Project(
                name="Marketing Campaign",
                status="Done"
            ),
            Project(
                name="Database Migration",
                status="Not Started"
            )
        ]
        
        # Add projects to database
        for project in projects:
            db.add(project)
        
        db.commit()
        
        # Get project IDs
        project_ids = [project.id for project in db.query(Project).all()]
        
        # Create Tasks with all status and priority values
        tasks = [
            # Active tasks with different priorities
            Task(
                name="Design homepage layout",
                status="Inbox",
                priority="High",
                project_id=project_ids[0],
                due_date=datetime.date.today() + datetime.timedelta(days=5)
            ),
            Task(
                name="Implement user authentication",
                status="Waiting",
                priority="Medium",
                project_id=project_ids[1],
                due_date=datetime.date.today() + datetime.timedelta(days=10)
            ),
            Task(
                name="Write API documentation",
                status="Done",
                priority="Low",
                project_id=project_ids[2],
                due_date=datetime.date.today() + datetime.timedelta(days=2)
            ),
            Task(
                name="Setup CI/CD pipeline",
                status="Next",
                priority="High",
                project_id=project_ids[3],
                due_date=datetime.date.today() + datetime.timedelta(days=15)
            ),
            
            # Past-due task (this should be genuinely past-due)
            Task(
                name="Fix critical security vulnerability",
                status="Doing",
                priority="High",
                project_id=project_ids[0],
                due_date=datetime.date.today() - datetime.timedelta(days=3)  # Past due by 3 days
            ),
            
            # Additional tasks to cover all combinations
            Task(
                name="Prepare presentation slides",
                status="Inbox",
                priority="Medium",
                project_id=project_ids[1],
                due_date=datetime.date.today() + datetime.timedelta(days=7)
            ),
            Task(
                name="Update dependencies",
                status="Waiting",
                priority="Low",
                project_id=project_ids[2],
                due_date=datetime.date.today() + datetime.timedelta(days=1)
            ),
            Task(
                name="Performance optimization",
                status="Done",
                priority="High",
                project_id=project_ids[3],
                due_date=datetime.date.today() - datetime.timedelta(days=2)  # Past due by 2 days
            )
        ]
        
        # Add tasks to database
        for task in tasks:
            db.add(task)
        
        db.commit()
        print("Database seeded successfully with realistic test data!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()