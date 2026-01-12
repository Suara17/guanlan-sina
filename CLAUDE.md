# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application named "guanlan-sina" (观澜-司南) using FastAPI for the backend and React for the frontend.
- **Backend**: FastAPI, SQLModel (ORM), PostgreSQL, Pydantic, Alembic.
- **Frontend**: React, TypeScript, Vite, TanStack Query, TanStack Router, Tailwind CSS, shadcn/ui.
- **Infrastructure**: Docker Compose, Traefik.

## Development Environment & Commands

### Docker Compose (Recommended)
- **Start Stack**: `docker compose watch` (starts backend, frontend, db, etc. with hot reload)
- **Logs**: `docker compose logs [service_name]` (e.g., `docker compose logs backend`)
- **Stop**: `docker compose down` (or `docker compose down -v` to remove volumes)
- **Exec**: `docker compose exec [service] [command]` (e.g., `docker compose exec backend bash`)

### Backend (`/backend`)
- **Package Manager**: `uv` (preferred) or `pip`
- **Install Dependencies**: `uv sync`
- **Activate Env**: `source .venv/bin/activate` (Linux/Mac) or `.venv\Scripts\activate` (Windows)
- **Run Local Server**: `fastapi dev app/main.py` (runs on localhost:8000)
- **Run Tests**: `bash ./scripts/test.sh` or `pytest`
- **Run Single Test**: `pytest tests/api/routes/test_users.py::test_read_user_me`
- **Lint/Format**: `ruff check .` / `ruff format .`
- **Database Migrations**:
  - Create revision: `alembic revision --autogenerate -m "message"`
  - Apply migrations: `alembic upgrade head`

### Frontend (`/frontend`)
- **Package Manager**: `npm`
- **Install Dependencies**: `npm install`
- **Run Local Server**: `npm run dev` (runs on localhost:5173)
- **Build**: `npm run build`
- **Lint**: `npm run lint` (uses Biome)
- **Generate API Client**: `npm run generate-client` (requires backend running)
- **E2E Tests**: `npx playwright test` (requires stack running)

## Code Structure

### Backend
- `app/main.py`: Entry point for FastAPI application.
- `app/api/`: API route handlers (endpoints).
- `app/core/`: Core configuration (settings, db connection, security).
- `app/models.py`: SQLModel database models and Pydantic schemas.
- `app/crud.py`: CRUD operations.
- `app/alembic/`: Database migration scripts.
- `app/email-templates/`: Email templates (MJML/HTML).
- `tests/`: Pytest test suite.

### Frontend
- `src/routes/`: Application routes (TanStack Router).
- `src/components/`: React components (Common & Feature-specific).
- `src/client/`: Auto-generated OpenAPI client.
- `src/hooks/`: Custom React hooks.
- `src/assets/`: Static assets.

## Common Workflows

1.  **Adding a Database Model**:
    - Add model class in `backend/app/models.py`.
    - Create migration: `alembic revision --autogenerate -m "Add X model"`.
    - Apply migration: `alembic upgrade head`.

2.  **Adding an API Endpoint**:
    - Define schema in `models.py` if needed.
    - Create route handler in `backend/app/api/routes/`.
    - Register router in `backend/app/api/main.py` if creating a new file.

3.  **Updating Frontend Client**:
    - Ensure backend is running.
    - Run `npm run generate-client` in `frontend/` directory.

4.  **Security Checks**:
    - `pre-commit` hooks run automatically on commit.
    - Run manually: `uv run pre-commit run --all-files`.
