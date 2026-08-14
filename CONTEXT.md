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
- Business logic is separated from routers to keep the API endpoints focused on handling HTTP requests and responses, while the actual business logic is encapsulated in dedicated service modules for better testability and maintainability

## Directory Layout
- backend/
- frontend/
  - src/
    - api/
      - client.js
    - pages/
      - ProjectsPage.jsx
      - TasksPage.jsx
  - .env.example
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
- [x] Created Pydantic v2 schemas for Project and Task in backend/app/schemas/
- [x] TaskCreate and TaskUpdate schemas do not accept past_due or updated_at fields (server-controlled)
- [x] Implemented FastAPI router for tasks with POST /tasks, GET /tasks, GET /tasks/{id}, PATCH /tasks/{id}, DELETE /tasks/{id}
- [x] Integrated tasks router into main application under /api prefix
- [x] Configured proper 404 responses for missing resources
- [x] Implemented validation that project_id exists when creating a task (returns 404 if not found)
- [x] Implemented GET /tasks with query filters: status, project_id, priority (combinable)
- [x] Implemented FastAPI router for projects with POST /projects, GET /projects, GET /projects/{id}, PATCH /projects/{id}, DELETE /projects/{id}
- [x] Integrated projects router into main application under /api prefix
- [x] Configured proper 404 responses for missing resources
- [x] Implemented cascade delete functionality for tasks when project is deleted
- [x] TaskCreate and TaskUpdate schemas do not accept past_due or updated_at fields (server-controlled)
- [x] Created backend/app/services/task_service.py with compute_past_due function
- [x] Integrated task service into Task read path to calculate past_due at request time
- [x] Added validation for Project.progress (0-100) in schema layer 
- [x] Added validation for Project.end_date vs start_date in schema layer
- [x] Set up test fixtures and configuration in backend/tests/
- [x] Added pytest and httpx to requirements.txt
- [x] Added test profile/command in README.md for running docker compose exec backend pytest
- [x] Updated CONTEXT.md with test setup summary, how to run tests, and "never point tests at dev db" rule
- [x] Added pytest tests for projects API endpoints (7/7 tests passing)
- [x] All project endpoint tests pass (create, get, list, update, delete with cascade)
- [x] Added pytest tests for tasks API endpoints (15/15 tests passing)
- [x] Backend task tests implemented and passing (14 tests)
- [x] All requirements covered including:
  - Create task with valid project_id succeeds
  - Create task with nonexistent project_id returns 404, not 500
  - past_due is true when due_date is in the past and status != Done
  - past_due is false when status == Done even if due_date is in the past
  - List tasks filters by project_id, status, and priority, individually and combined
  - Client cannot set past_due or updated_at directly via the API (verify it's ignored/rejected)
  - Update task changes updated_at automatically
- [x] Created frontend structure with Vite + React app:
  - src/api/client.js - fetch wrapper reading API base URL from env var VITE_API_URL
  - src/pages/ProjectsPage.jsx and TasksPage.jsx placeholders
  - Basic routing (react-router-dom) between /projects and /tasks, with a simple nav header
  - .env.example in frontend/ with VITE_API_URL=http://localhost:8000/api

## API Surface - /projects

### GET /projects
Retrieves a list of all projects.
Query parameters:
- status: Optional string to filter projects by status

### GET /projects/{id}
Retrieves a specific project by ID.
Returns 404 if project doesn't exist.

### POST /projects
Creates a new project.
Returns the created project.

### PATCH /projects/{id}
Updates an existing project partially.
Returns 404 if project doesn't exist.

### DELETE /projects/{id}
Deletes a project and all associated tasks (cascades).
Returns 404 if project doesn't exist.

## API Surface - /tasks

### GET /tasks
Retrieves a list of all tasks.
Query parameters:
- status: Optional string to filter tasks by status
- project_id: Optional integer to filter tasks by project ID
- priority: Optional string to filter tasks by priority
All query parameters are combinable.

### GET /tasks/{id}
Retrieves a specific task by ID.
Returns 404 if task doesn't exist.

### POST /tasks
Creates a new task.
Requires a valid project_id - returns 404 if the referenced project doesn't exist.
Returns the created task.

### PATCH /tasks/{id}
Updates an existing task partially.
Returns 404 if task doesn't exist.

### DELETE /tasks/{id}
Deletes a task.
Returns 404 if task doesn't exist.