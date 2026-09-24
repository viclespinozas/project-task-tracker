# Project Task Tracker

A full-stack web application for tracking projects and tasks with a Kanban board interface.

## Tech Stack

- Backend: Python (FastAPI)
- Frontend: React (with Vite)
- Database: PostgreSQL
- Containerization: Docker Compose

## Features

- Create, read, update, delete projects and tasks
- Kanban board view for tasks
- Project status tracking (Not Started, In Progress, Done)
- Task priority levels (High, Medium, Low)
- Task status tracking (Inbox, Waiting, Next, Doing, Done)
- Past-due task detection and highlighting
- Responsive UI with modern design

## Architecture

The application follows a standard full-stack architecture with:
- A backend API built with FastAPI
- A frontend React application
- Database persistence using PostgreSQL
- Docker containerization for easy deployment

## Application Overview

This is a project management tool that allows users to organize their work into projects and tasks. Users can track the progress of tasks through different statuses (Inbox, Waiting, Next, Doing, Done) and prioritize them with High, Medium, or Low priority levels.

The application features a Kanban board view that provides a visual representation of tasks across different status columns. It also includes functionality to mark projects as Not Started, In Progress, or Done.

Key features include:
- Creating and managing projects with descriptions and statuses
- Creating individual tasks within projects with due dates, priorities, and statuses
- Visualizing task workflow through the Kanban board interface
- Automatic detection of past-due tasks based on current date
- Responsive web interface that works on desktop and mobile devices

## Database Schema

The application uses PostgreSQL for data persistence with two main entities:

### Projects
- id (integer, primary key)
- name (string, required)
- assignee (string, optional)
- priority (string, optional)
- progress (integer, 0-100, optional)
- start_date (date, optional)
- end_date (date, optional)
- start_value (integer, optional)
- end_value (integer, optional)
- status (string, required, one of: Not Started, In Progress, Done)

### Tasks
- id (integer, primary key)
- name (string, required)
- status (string, required, one of: Inbox, Waiting, Next, Doing, Done)
- assignee (string, optional)
- due_date (date, optional)
- priority (string, required, one of: High, Medium, Low)
- description (string, optional)
- updated_at (datetime, auto-set on update)
- project_id (integer, foreign key to Projects)

## API Endpoints

### Projects
- GET /projects - Get all projects
- GET /projects/{project_id} - Get a specific project
- POST /projects - Create a new project
- PUT /projects/{project_id} - Update a project
- DELETE /projects/{project_id} - Delete a project

### Tasks
- GET /tasks - Get all tasks
- GET /tasks/{task_id} - Get a specific task
- POST /tasks - Create a new task
- PUT /tasks/{task_id} - Update a task
- DELETE /tasks/{task_id} - Delete a task

## Running the Application

To run the application locally:

1. Clone the repository
2. Set up environment variables (copy .env.example to .env and adjust as needed)
3. Run with Docker Compose:
   ```bash
   docker-compose up
   ```
4. Run database migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

## Component Contract: KanbanBoard

The KanbanBoard component is a generic, reusable component for drag-and-drop task management. It takes the following props:

- `items`: An array of items to display in the board
- `columns`: An ordered list of status values and labels, each with `value` and `label` properties
- `getItemStatus`: A function that takes an item and returns its current status value
- `onStatusChange`: A callback function called when an item's status changes, with parameters `(itemId, newStatus)`
- `renderCard`: A render-prop function that takes an item and returns JSX for the card content

The component groups items into columns by status and supports drag-and-drop between columns, calling `onStatusChange(itemId, newStatus)` on drop. It is status-agnostic and can be used with any entity that has a status.

## Seeding Data

To seed the database with sample projects and tasks for local development or demo purposes:

```bash
cd backend && python app/scripts/seed.py
```

The seed script creates:
- 4 Projects with different statuses (Not Started, In Progress, Done)
- 8 Tasks covering all status values (Inbox, Waiting, Next, Doing, Done)
- All priority levels (High, Medium, Low) 
- At least one genuinely past-due task

This script is designed for local development and demo purposes only.


## Testing

To run tests:

```bash
docker-compose exec backend pytest
```

## Build Log

- [8/20/2026] Created generic KanbanBoard component in frontend/src/components/KanbanBoard.jsx
  - Implemented drag-and-drop functionality using @dnd-kit
  - Component is status-agnostic and reusable
  - Takes props: items, columns, getItemStatus, onStatusChange, renderCard
  - Supports reordering within columns and moving between columns
- [9/10/2026] Updated KanbanBoard component documentation to ensure it matches the generic, reusable contract
- [9/10/2026] Wired ProjectsPage.jsx to use KanbanBoard component
  - Fetch projects from API on mount
  - Group projects by status (Not Started / In Progress / Done)
  - Render cards showing name, assignee, priority, progress
  - Handle drag-and-drop with PATCH requests to update project status
  - Update local state optimistically with revert on API failure
- [9/10/2026] Wired TasksPage.jsx to use KanbanBoard component with project filter and past_due indicators
  - Implemented Inbox/Waiting/Next/Doing/Done columns
  - Each card shows name, assignee, priority, due date, and visual flag for past_due tasks
  - Added project filter dropdown populated from GET /projects endpoint
- [9/10/2026] Added modal forms for creating and editing Projects and Tasks
  - Created ModalForm component as a reusable controlled form component
  - Implemented form validation with API error handling for 422 responses
  - Added "Add card" button per column and click-to-edit functionality
  - Forms map directly to Create/Update schemas from the backend
  - Uses API client for POST/PATCH requests
  - Refreshes the board on success
- [9/24/2026] Fixed past_due incorrectly true for completed tasks
  - `services/task_service.compute_past_due` compared `status` against the literal `"DONE"`, but the real value stored/sent everywhere is `"Done"` (`TaskStatus.DONE.value`), so the comparison never matched
  - Completed tasks with a past due date were being flagged `past_due: true` in the API and on the Kanban board's past-due indicator
  - Now compares against `TaskStatus.DONE.value` instead of a hardcoded string
- [9/24/2026] Fixed `alembic upgrade head` failing with `DuplicateTable`
  - `main.py` called `Base.metadata.create_all(bind=engine)` on every backend startup, which created `projects`/`tasks` directly via SQLAlchemy without ever recording an `alembic_version` row
  - Running the documented `alembic upgrade head` afterward always failed, since Alembic tried to `CREATE TABLE` on tables that already existed
  - Removed the `create_all` call so Alembic is the single owner of the schema; reconciled the existing dev database (which had real seed data) with `alembic stamp head`, a non-destructive operation that only records the current revision without touching any rows
  - Fresh environments now require `alembic upgrade head` to get tables at all — see README's Database Migrations section
- [9/24/2026] Fixed backend test suite
  - Bare `pytest` failed to even collect tests (`ModuleNotFoundError: No module named 'app'`) because the backend root wasn't on `sys.path` unless invoked as `python -m pytest`; added `backend/pytest.ini` with `pythonpath = .` to fix this for both invocation styles
  - `tests/test_tasks_simple.py` passed raw ISO date strings directly into `Task`/`Project` ORM constructors (bypassing the Pydantic schema that normally parses them), which SQLite's date type rejects; changed the test fixtures to real `date(...)` objects
  - Several tests across `test_compute_past_due.py`, `tests/test_simple_tasks.py`, `tests/test_tasks.py`, and `tests/test_tasks_simple.py` asserted against the same wrong-case `"DONE"` status the `past_due` fix above corrected; updated them to `"Done"`
  - `test_update_task_changes_updated_at_automatically` was flaky against SQLite, whose `CURRENT_TIMESTAMP` only has second-level resolution — a create+update in the same test can land in the same second and produce an identical `updated_at`; added a 1-second delay between create and update so the assertion is reliable
  - Full suite (48 tests) now passes via the documented `docker-compose exec backend pytest`
