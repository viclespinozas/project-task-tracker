# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A self-hosted project/task tracker (Notion-lite). FastAPI + SQLAlchemy backend, React + Vite frontend, PostgreSQL via Docker Compose. Two entities only: Projects and Tasks (one-to-many, `Task.project_id`).

## Commands

### Run the app
```bash
docker-compose up
docker-compose exec backend alembic upgrade head   # required — see note below
```
Frontend: http://localhost:5173 (served via `serve` on the built `dist`, per `frontend/Dockerfile`). Backend: http://localhost:8000/api. Note `frontend/vite.config.js` sets the Vite dev server to port 3000 — running `yarn dev` locally (outside Docker) serves on 3000, not 5173.

Alembic is the sole owner of the schema — `main.py` no longer calls `Base.metadata.create_all`. On a brand-new database, the API will 500 on any DB-touching endpoint until `alembic upgrade head` has been run at least once; it's not just for "when migrations change."

### Seed sample data
```bash
cd backend && python app/scripts/seed.py
```
Creates 4 projects (all statuses), 8 tasks (all statuses/priorities), including at least one genuinely past-due task. Dev/demo only.

### Tests
```bash
docker-compose exec backend pytest
docker-compose exec backend pytest tests/test_tasks.py::test_name   # single test
```
`backend/pytest.ini` sets `pythonpath = .` so bare `pytest` (not just `python -m pytest`) can resolve `import app` from the `backend/` root — without it, `pytest` fails to even collect tests with `ModuleNotFoundError: No module named 'app'`.

`backend/tests/conftest.py`'s `test_engine` fixture hard-fails unless `settings.database_url` contains the substring `"test"` — this is what keeps tests from accidentally running against the dev database. The repo's `.env` files satisfy this by pointing `DATABASE_URL` at `sqlite:///./test.db` even outside a test context; don't repoint `DATABASE_URL` to a non-test database without accounting for this guard.

There is no single canonical test setup: `test_tasks.py` and `test_simple_tasks.py` use the shared `conftest.py` fixtures (`client`, `db_session`, in-memory SQLite via `StaticPool`), while `test_projects.py` and `test_tasks_simple.py` define their own local `test_db`/`db_session` fixtures with a separate in-memory SQLite engine and don't use the shared `client` fixture. When adding tests, check which pattern the target file already uses rather than assuming `conftest.py` fixtures are always in scope.

## Architecture

### Backend (`backend/app/`)
Layout: `models/` (SQLAlchemy ORM) → `schemas/` (Pydantic request/response) → `routers/` (FastAPI endpoints, mounted under `/api` in `main.py`) → `services/` (business logic pulled out of routers).

- `db/session.py` builds the SQLAlchemy engine from `settings.database_url` (from `core/config.py`, a `pydantic-settings` `BaseSettings` reading `.env`), but **skips engine creation when running under Alembic** (checks `'alembic' in sys.modules`) — Alembic's `env.py` manages its own connection instead.
- Alembic (`backend/alembic/versions/`) is the **only** thing that creates tables — `main.py` does not call `Base.metadata.create_all`. A fresh database has no tables until `alembic upgrade head` runs. (It used to also call `create_all` on every startup, which silently created tables outside Alembic's tracking and made `alembic upgrade head` fail with `DuplicateTable` on the very next run — don't reintroduce that call.)
- `status` and `priority` fields (`Project.status`, `Task.status`, `Task.priority`) are stored as plain `String` columns, not DB-level enums — the `ProjectStatus`/`TaskStatus`/`TaskPriority` `Enum` classes in `models/project.py` and `models/task.py` exist only as documentation of the valid string values; the DB does not enforce membership.
- `past_due` on `Task` is **not a column** — it's computed on every read/write in `services/task_service.compute_past_due(due_date, status)` and each router handler sets `task.past_due` on the ORM instance before returning it through `TaskRead`. Any new endpoint or query path that returns a `Task` must call `compute_past_due` itself; it won't happen automatically. The "done" check inside it compares against `TaskStatus.DONE.value` (`"Done"`) — it was previously hardcoded as the wrong-case string `"DONE"`, which meant completed tasks with a past due date were always (incorrectly) flagged `past_due: true`; if you touch this function again, compare against the enum value, not a literal.
- `TaskUpdate`/`ProjectUpdate` (`schemas/`) reuse the same `Base` schema as `Create`, so PATCH endpoints rely on `model_dump(exclude_unset=True)` to apply partial updates — passing an explicit `null` for a field will unset it because Pydantic can't distinguish "not sent" only when the field truly wasn't included in the request body.

### Frontend (`frontend/src/`)
- `components/KanbanBoard.jsx` is a generic, status-agnostic drag-and-drop board (via `@dnd-kit`), driven entirely by props: `items`, `columns` (ordered `{value, label}` list), `getItemStatus(item)`, `onStatusChange(itemId, newStatus)`, and a `renderCard(item)` render prop. It has no knowledge of Projects vs. Tasks.
- `pages/ProjectsPage.jsx` and `pages/TasksPage.jsx` each wire `KanbanBoard` to their respective API resource: fetch on mount, group into columns by status, apply optimistic local state updates on drag with revert-on-failure, and PATCH the new status to the backend. `TasksPage` additionally supports filtering by project (populated from `GET /projects`) and renders a past-due visual flag.
- `components/ModalForm.jsx` is the shared controlled create/edit form for both Projects and Tasks, mapping directly to the backend's Create/Update schemas and surfacing 422 validation errors from the API.
- `api/client.js` is a minimal fetch wrapper (`get`/`post`/`patch`/`delete`) reading `VITE_API_URL` (defaults to `http://localhost:8000/api`).

### Docker Compose
`docker-compose.yml` defines `db` (Postgres 16, with a healthcheck gating `backend` startup), `backend`, and `frontend`, all on an `app-network` bridge. `backend` mounts the local `./backend` directory as a volume, so code edits are picked up without rebuilding the image (uvicorn still needs a restart unless `--reload` is added). `POSTGRES_MULTIPLE_DATABASES` is set on `db` but `init-scripts/` is currently empty, so it has no effect.
