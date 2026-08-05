# Project Context

## Project Goal
To build a self-hosted project/task tracker application that serves as a replacement for Notion, providing efficient management of projects and tasks with a clean, modern interface.

## Stack
- FastAPI (sync)
- SQLAlchemy
- PostgreSQL
- Alembic
- pytest
- React (Vite)
- dnd-kit
- Docker Compose

## Data Model Summary
Project (1) -> Task (many)

## Project Fields
- id
- name
- assignee
- priority
- progress (int 0-100)
- start_date
- end_date
- start_value
- end_value
- status (enum: Not Started, In Progress, Done)

## Task Fields
- id
- name
- status (enum: Inbox, Waiting, Next, Doing, Done)
- assignee
- due_date
- priority (enum: High, Medium, Low)
- description
- past_due (computed, not stored as user input)
- updated_at
- project_id (FK -> Project)

## Model Field Types Confirmation
- Project.id: Integer (PK) ✓
- Project.name: String ✓
- Project.assignee: String ✓
- Project.priority: String ✓
- Project.progress: Integer ✓
- Project.start_date: Date ✓
- Project.end_date: Date ✓
- Project.start_value: Integer ✓
- Project.end_value: Integer ✓
- Project.status: String (enum values: Not Started, In Progress, Done) ✓

- Task.id: Integer (PK) ✓
- Task.name: String ✓
- Task.status: String (enum values: Inbox, Waiting, Next, Doing, Done) ✓
- Task.assignee: String ✓
- Task.due_date: Date ✓
- Task.priority: String (enum values: High, Medium, Low) ✓
- Task.description: String ✓
- Task.updated_at: DateTime (auto-set on update via onupdate=func.now()) ✓
- Task.project_id: Integer (FK to projects.id, nullable=False) ✓

## Design Decision Notes
- past_due field is computed in service layer, not persisted in database (as requested)

## Directory Layout
- backend/
- frontend/
- docker-compose.yml

## Services
- **db**: PostgreSQL 16 database service
  - Primary database: `tracker` (from POSTGRES_DB env var)
  - Test database: `tracker_test` (created at container init)
  - Uses named volume `postgres_data` for data persistence
  - Exposed on port 5432

## Directory Layout
- backend/
- frontend/
- docker-compose.yml

## Services
- **db**: PostgreSQL 16 database service
  - Primary database: `tracker` (from POSTGRES_DB env var)
  - Test database: `tracker_test` (created at container init)
  - Uses named volume `postgres_data` for data persistence
  - Exposed on port 5432

## Backend Service
- **backend**: FastAPI application service
  - Built from ./backend/Dockerfile
  - Depends on db service
  - Reads DATABASE_URL from .env file
  - Exposes port 8000
  - Mounts backend/ as a volume for live reload during development (uvicorn --reload)
  - Uses uvicorn to run the FastAPI app

## How to Run
To start the application, run `docker compose up backend` in the project root directory.

## Build Log
- [x] Created SQLAlchemy models for Project and Task entities
- [x] Implemented proper relationships between Project and Task
- [x] Added cascade delete functionality on project removal
- [x] Implemented enum types for status fields
- [x] Added updated_at field with auto-update capability
- [x] Confirmed all field types match requirements
- [x] Noted that past_due is computed in service layer, not stored
- [x] Initialized Alembic in backend/
- [x] Configured alembic.ini to pull DATABASE_URL from app.core.config.Settings
- [x] Configured env.py to target models' metadata
- [x] Generated initial migration creating projects and tasks tables with all constraints and enum types
- [x] Added note to README.md about running migrations

