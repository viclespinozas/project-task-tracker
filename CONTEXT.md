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
cd backend
python app/scripts/seed.py
```

## Testing

To run tests:

```bash
docker-compose exec backend pytest

## Build Log

- [8/20/2026] Created generic KanbanBoard component in frontend/src/components/KanbanBoard.jsx
  - Implemented drag-and-drop functionality using @dnd-kit
  - Component is status-agnostic and reusable
  - Takes props: items, columns, getItemStatus, onStatusChange, renderCard
  - Supports reordering within columns and moving between columns
- [9/10/2026] Updated KanbanBoard component documentation to ensure it matches the generic, reusable contract
