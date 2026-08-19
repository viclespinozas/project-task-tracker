A self-hosted project/task tracker application designed to replace Notion. This tool helps manage projects and tasks with a clean, efficient interface built on modern web technologies.

## Features

- Project management
- Task tracking
- Kanban board view for tasks
- Past-due task detection
- Responsive UI

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, SQLAlchemy
- Database: PostgreSQL (via Docker)

## Getting Started

1. Clone the repository
2. Set up environment variables (copy .env.example to .env and adjust as needed)
3. Run with Docker Compose

```bash
docker-compose up
```

## Database Migrations

To run migrations:

```bash
docker-compose exec backend alembic upgrade head
```

## End-to-End Setup Steps

1. Clone the repository
2. Copy `.env.example` to `.env` and adjust as needed  
3. Run `docker compose up`
4. Run database migrations: `docker compose exec backend alembic upgrade head`
5. Visit the UI at http://localhost:5173

## Seeding Data

To seed the database with sample projects and tasks for local development or demo purposes:

```bash
cd backend
python app/scripts/seed.py
```

## Running Tests

To run tests:

```bash
docker-compose exec backend pytest