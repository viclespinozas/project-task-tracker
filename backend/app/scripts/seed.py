#!/usr/bin/env python3
"""
Seed script to populate the database with realistic test data.
This script creates Projects and Tasks covering all status and priority values,
including at least one genuinely past-due task.
"""

import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.app.db.session import Base, engine
from backend.app.models.project import Project
from backend.app.models.task import Task

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
                description="Complete overhaul of company website",
                status="Not Started"
            ),
            Project(
                name="Mobile App Development",
                description="Development of new mobile application",
                status="In Progress"
            ),
            Project(
                name="Marketing Campaign",
                description="Q3 marketing initiative",
                status="Done"
            ),
            Project(
                name="Database Migration",
                description="Migrate from old system to new database",
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
                description="Create wireframes for homepage",
                status="Inbox",
                priority="High",
                project_id=project_ids[0],
                due_date=datetime.date.today() + datetime.timedelta(days=5)
            ),
            Task(
                name="Implement user authentication",
                description="Set up login and registration system",
                status="Waiting",
                priority="Medium",
                project_id=project_ids[1],
                due_date=datetime.date.today() + datetime.timedelta(days=10)
            ),
            Task(
                name="Write API documentation",
                description="Document all API endpoints",
                status="Done",
                priority="Low",
                project_id=project_ids[2],
                due_date=datetime.date.today() + datetime.timedelta(days=2)
            ),
            Task(
                name="Setup CI/CD pipeline",
                description="Configure automated deployment",
                status="Next",
                priority="High",
                project_id=project_ids[3],
                due_date=datetime.date.today() + datetime.timedelta(days=15)
            ),
            
            # Past-due task (this should be genuinely past-due)
            Task(
                name="Fix critical security vulnerability",
                description="Address reported security issue",
                status="Doing",
                priority="High",
                project_id=project_ids[0],
                due_date=datetime.date.today() - datetime.timedelta(days=3)  # Past due by 3 days
            ),
            
            # Additional tasks to cover all combinations
            Task(
                name="Prepare presentation slides",
                description="Create slides for quarterly review",
                status="Inbox",
                priority="Medium",
                project_id=project_ids[1],
                due_date=datetime.date.today() + datetime.timedelta(days=7)
            ),
            Task(
                name="Update dependencies",
                description="Upgrade all npm packages to latest versions",
                status="Waiting",
                priority="Low",
                project_id=project_ids[2],
                due_date=datetime.date.today() + datetime.timedelta(days=1)
            ),
            Task(
                name="Performance optimization",
                description="Improve application loading times",
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
