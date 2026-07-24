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

## Directory Layout
- backend/
- frontend/
- docker-compose.yml

## Build Log