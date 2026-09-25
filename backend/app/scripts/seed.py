#!/usr/bin/env python3
"""
Seed script to populate the database with a realistic fixture: 2 projects,
each with 2 tasks in every task status, so the Kanban board is fully
populated end to end regardless of which project you filter by.

Run from backend/: python app/scripts/seed.py
"""

import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal, Base, engine
from app.models import Project, Task

TODAY = date.today()


def build_projects():
    return [
        Project(
            name="Website Redesign",
            assignee="Priya Nair",
            priority="High",
            progress=60,
            start_date=TODAY - timedelta(days=30),
            end_date=TODAY + timedelta(days=20),
            status="In Progress",
        ),
        Project(
            name="Mobile App Launch",
            assignee="Marcus Webb",
            priority="Medium",
            progress=0,
            start_date=TODAY + timedelta(days=7),
            end_date=TODAY + timedelta(days=90),
            status="Not Started",
        ),
    ]


def build_tasks(website_id, mobile_id):
    return [
        # Website Redesign
        Task(name="Audit current site analytics", status="Inbox", priority="Medium",
             assignee="Priya Nair", project_id=website_id,
             due_date=TODAY + timedelta(days=6)),
        Task(name="Collect stakeholder feedback", status="Inbox", priority="Low",
             assignee="Priya Nair", project_id=website_id,
             due_date=TODAY + timedelta(days=8)),
        Task(name="Approve new brand color palette", status="Waiting", priority="Medium",
             assignee="Sana Malik", project_id=website_id,
             due_date=TODAY + timedelta(days=4)),
        Task(name="Legal review of privacy policy copy", status="Waiting", priority="Low",
             assignee="Diego Fernandez", project_id=website_id,
             due_date=TODAY + timedelta(days=12)),
        Task(name="Design homepage wireframes", status="Next", priority="High",
             assignee="Priya Nair", project_id=website_id,
             due_date=TODAY + timedelta(days=3)),
        Task(name="Set up staging environment", status="Next", priority="Medium",
             assignee="Tom Reilly", project_id=website_id,
             due_date=TODAY + timedelta(days=9)),
        Task(name="Build responsive navigation component", status="Doing", priority="High",
             assignee="Tom Reilly", project_id=website_id,
             due_date=TODAY + timedelta(days=2)),
        Task(name="Migrate blog content to new CMS", status="Doing", priority="Medium",
             assignee="Sana Malik", project_id=website_id,
             due_date=TODAY - timedelta(days=1)),  # deliberately past due
        Task(name="Kickoff meeting with stakeholders", status="Done", priority="Low",
             assignee="Priya Nair", project_id=website_id,
             due_date=TODAY - timedelta(days=25)),
        Task(name="Finalize sitemap", status="Done", priority="Medium",
             assignee="Priya Nair", project_id=website_id,
             due_date=TODAY - timedelta(days=18)),

        # Mobile App Launch
        Task(name="Research app store submission guidelines", status="Inbox", priority="Low",
             assignee="Marcus Webb", project_id=mobile_id,
             due_date=TODAY + timedelta(days=14)),
        Task(name="Draft onboarding flow copy", status="Inbox", priority="Medium",
             assignee="Aisha Khan", project_id=mobile_id,
             due_date=TODAY + timedelta(days=16)),
        Task(name="Vendor sign-off for push notification service", status="Waiting", priority="High",
             assignee="Marcus Webb", project_id=mobile_id,
             due_date=TODAY + timedelta(days=10)),
        Task(name="Marketing review of app store listing", status="Waiting", priority="Medium",
             assignee="Aisha Khan", project_id=mobile_id,
             due_date=TODAY + timedelta(days=11)),
        Task(name="Define MVP feature scope", status="Next", priority="High",
             assignee="Marcus Webb", project_id=mobile_id,
             due_date=TODAY + timedelta(days=5)),
        Task(name="Set up CI/CD pipeline for mobile builds", status="Next", priority="Medium",
             assignee="Tom Reilly", project_id=mobile_id,
             due_date=TODAY + timedelta(days=13)),
        Task(name="Implement push notification service", status="Doing", priority="High",
             assignee="Tom Reilly", project_id=mobile_id,
             due_date=TODAY + timedelta(days=1)),
        Task(name="Build user authentication flow", status="Doing", priority="High",
             assignee="Aisha Khan", project_id=mobile_id,
             due_date=TODAY - timedelta(days=4)),  # deliberately past due
        Task(name="Competitive analysis of similar apps", status="Done", priority="Low",
             assignee="Marcus Webb", project_id=mobile_id,
             due_date=TODAY - timedelta(days=20)),
        Task(name="Finalize tech stack decision", status="Done", priority="Medium",
             assignee="Tom Reilly", project_id=mobile_id,
             due_date=TODAY - timedelta(days=15)),
    ]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        db.query(Task).delete()
        db.query(Project).delete()
        db.commit()

        website, mobile = build_projects()
        db.add(website)
        db.add(mobile)
        db.commit()

        for task in build_tasks(website.id, mobile.id):
            db.add(task)
        db.commit()

        print(f"Seeded {2} projects and {len(build_tasks(website.id, mobile.id))} tasks.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
