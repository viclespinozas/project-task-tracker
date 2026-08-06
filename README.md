A self-hosted project/task tracker application designed to replace Notion. This tool helps manage projects and tasks with a clean, efficient interface built on modern web technologies.

## Features

- Project management
- Task tracking
- Responsive UI

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, SQLAlchemy
- Database: PostgreSQL (via Docker)

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Run with Docker Compose

```bash
docker-compose up
```

## Database Migrations

To run migrations:

```bash
docker-compose exec backend alembic upgrade head