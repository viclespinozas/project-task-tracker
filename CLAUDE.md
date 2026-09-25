# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Keep this file current.** After completing a task that changes a command, an architectural fact documented below, or adds a non-obvious gotcha, update the relevant section here in the same session — don't let it drift and require a large catch-up pass later. Add a dated entry to `CONTEXT.md`'s Build Log for the "why" behind the change; keep only current-state facts here.

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
docker-compose exec backend python app/scripts/seed.py
```
**Deletes all existing projects/tasks first**, then creates a fixed fixture: 2 realistic projects (Website Redesign, Mobile App Launch), each with 2 tasks in every one of the 5 task statuses (20 tasks total), including 2 deliberately past-due tasks. It imports the real `app.db.session`/`app.models` and runs against whatever `DATABASE_URL` the app is actually using — earlier versions of this script hardcoded their own disconnected SQLite path and never touched the real dev database, so re-running it appeared to do nothing.

### Tests
```bash
docker-compose exec backend pytest
docker-compose exec backend pytest tests/test_tasks.py::test_name   # single test
```
`backend/pytest.ini` sets `pythonpath = .` so bare `pytest` (not just `python -m pytest`) can resolve `import app` from the `backend/` root — without it, `pytest` fails to even collect tests with `ModuleNotFoundError: No module named 'app'`.

`backend/tests/conftest.py`'s `test_engine` fixture hard-fails unless `settings.database_url` contains the substring `"test"` — this is what keeps tests from accidentally running against the dev database. The repo's `.env` files satisfy this by pointing `DATABASE_URL` at `sqlite:///./test.db` even outside a test context; don't repoint `DATABASE_URL` to a non-test database without accounting for this guard.

There is no single canonical test setup: `test_tasks.py` and `test_simple_tasks.py` use the shared `conftest.py` fixtures (`client`, `db_session`, in-memory SQLite via `StaticPool`), while `test_projects.py` and `test_tasks_simple.py` define their own local `test_db`/`db_session` fixtures with a separate in-memory SQLite engine and don't use the shared `client` fixture. When adding tests, check which pattern the target file already uses rather than assuming `conftest.py` fixtures are always in scope.

### CI (`.github/workflows/ci.yml`)
Every entry in `backend/requirements.txt` is pinned to an exact version — **keep it that way**. It used to be fully unpinned, and CI (no dependency cache, resolves fresh from PyPI every run) silently picked up a newer `sqlalchemy` than the one actually running in the built Docker image, which broke `psycopg2` import specifically inside Alembic's dynamic `env.py` loading. If you bump a dependency, bump it deliberately in both `requirements.txt` and rebuild the Docker image, not by leaving it unpinned. CI's Python version (`setup-python`) is also deliberately kept at 3.12 to match `backend/Dockerfile` — don't let those drift apart either.

## Architecture

### Backend (`backend/app/`)
Layout: `models/` (SQLAlchemy ORM) → `schemas/` (Pydantic request/response) → `routers/` (FastAPI endpoints, mounted under `/api` in `main.py`) → `services/` (business logic pulled out of routers).

- `db/session.py` builds the SQLAlchemy engine from `settings.database_url` (from `core/config.py`, a `pydantic-settings` `BaseSettings` reading `.env`), but **skips engine creation when running under Alembic** (checks `'alembic' in sys.modules`) — Alembic's `env.py` manages its own connection instead.
- Alembic (`backend/alembic/versions/`) is the **only** thing that creates tables — `main.py` does not call `Base.metadata.create_all`. A fresh database has no tables until `alembic upgrade head` runs. (It used to also call `create_all` on every startup, which silently created tables outside Alembic's tracking and made `alembic upgrade head` fail with `DuplicateTable` on the very next run — don't reintroduce that call.)
- `status` and `priority` fields (`Project.status`, `Task.status`, `Task.priority`) are stored as plain `String` columns, not DB-level enums — the `ProjectStatus`/`TaskStatus`/`TaskPriority` `Enum` classes in `models/project.py` and `models/task.py` exist only as documentation of the valid string values; the DB does not enforce membership.
- `past_due` on `Task` is **not a column** — it's computed on every read/write in `services/task_service.compute_past_due(due_date, status)` and each router handler sets `task.past_due` on the ORM instance before returning it through `TaskRead`. Any new endpoint or query path that returns a `Task` must call `compute_past_due` itself; it won't happen automatically. The "done" check inside it compares against `TaskStatus.DONE.value` (`"Done"`) — it was previously hardcoded as the wrong-case string `"DONE"`, which meant completed tasks with a past due date were always (incorrectly) flagged `past_due: true`; if you touch this function again, compare against the enum value, not a literal.
- `TaskUpdate`/`ProjectUpdate` (`schemas/`) reuse the same `Base` schema as `Create`, so PATCH endpoints rely on `model_dump(exclude_unset=True)` to apply partial updates — passing an explicit `null` for a field will unset it because Pydantic can't distinguish "not sent" only when the field truly wasn't included in the request body.

### Frontend (`frontend/src/`)
- `components/KanbanBoard.jsx` is a generic, status-agnostic drag-and-drop board (via `@dnd-kit`), driven entirely by props: `items`, `columns` (ordered `{value, label}` list), `getItemStatus(item)`, `onStatusChange(itemId, newStatus)`, and a `renderCard(item)` render prop. It has no knowledge of Projects vs. Tasks. Its `columnItems` state is resynced from the `items` prop via a `useEffect` keyed on `[items]` — it used to only be computed once, inside `useState`'s initializer, so creating/editing/refetching data never showed up on the board without a full page reload.
- `pages/ProjectsPage.jsx` and `pages/TasksPage.jsx` each wire `KanbanBoard` to their respective API resource: fetch on mount, group into columns by status, apply optimistic local state updates on drag with revert-on-failure, and PATCH the new status to the backend. `TasksPage` additionally supports filtering by project (populated from `GET /projects`), passes that same `projects` list into `ModalForm` for the task form's project picker, and renders a past-due visual flag from the backend's `task.past_due` — **not** recomputed from `due_date` client-side (recomputing it from the date alone, ignoring status, was a real bug: it flagged completed/`Done` tasks with a past due date as still past-due).
- `components/ModalForm.jsx` is the shared controlled create/edit form for both Projects and Tasks, mapping directly to the backend's Create/Update schemas and surfacing 422 validation errors from the API. The task form has a required "Project" `<select>` (populated from the `projects` prop) — creating a task with no way to pick a project used to 404 against the backend, since `project_id` was never sent. `formData` is resynced from the `initialData`/`isOpen`/`type` props via a `useEffect` — same stale-props-in-`useState` pattern as `KanbanBoard` above; without it, Edit always showed blank/leftover fields instead of the item actually being edited, because the component stays mounted (just renders `null`) while closed.
- `api/client.js` is a minimal fetch wrapper (`get`/`post`/`patch`/`delete`) reading `VITE_API_URL` (defaults to `http://localhost:8000/api`). It throws on non-2xx responses with `error.response = { status, data }` attached (fetch itself only rejects on network failure) — callers rely on this to distinguish real failures from success; don't revert to a bare `.then(r => r.json())` or every failed request will silently look like it succeeded.
- Theming: CSS custom properties defined under `:root` (light) and overridden under `:root[data-theme='dark']` in `index.css`. `components/ThemeToggle.jsx` toggles `document.documentElement`'s `data-theme` attribute and persists the choice to `localStorage`; an inline script in `index.html`'s `<head>` sets `data-theme` before first paint (reading `localStorage`, falling back to `prefers-color-scheme`) to avoid a flash of the wrong theme.

### Docker Compose
`docker-compose.yml` defines `db` (Postgres 16, with a healthcheck gating `backend` startup), `backend`, and `frontend`, all on an `app-network` bridge. `backend` mounts the local `./backend` directory as a volume, so code edits are picked up without rebuilding the image (uvicorn still needs a restart unless `--reload` is added). `POSTGRES_MULTIPLE_DATABASES` is set on `db` but `init-scripts/` is currently empty, so it has no effect.

## History
`CONTEXT.md`'s "Build Log" section has a dated, one-entry-per-change log of what was built or fixed and why, going back to the component's original implementation. Check it for the reasoning behind a specific past change; this file (`CLAUDE.md`) only holds the current-state facts that change day to day.
