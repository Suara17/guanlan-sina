# GuanLan-SiNan Visualization Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build "GuanLan" (Production Visualization) and "SiNan" (Decision Support) systems using FastAPI and React.

**Architecture:** Monorepo with `backend` (FastAPI + SQLModel + PostgreSQL) and `frontend` (React + TanStack Router + Tailwind). Real-time updates via WebSocket (or polling for MVP).

**Tech Stack:**
- **Backend:** Python 3.10+, FastAPI, SQLModel, PostgreSQL, Celery (to be added), Redis (to be added).
- **Frontend:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui.

---

## Phase 1: Infrastructure & Core Backend

### Task 1.1: Add Celery & Redis Support
**Context:** The design requires asynchronous tasks (notifications, simulation) but Celery is missing from `pyproject.toml`.
**Files:**
- Modify: `backend/pyproject.toml`
- Create: `backend/app/core/celery_app.py`
- Modify: `backend/app/core/config.py`
- Create: `backend/app/worker.py`

**Step 1: Add Dependencies**
Add `celery[redis]` and `redis` to `backend/pyproject.toml`.
```bash
cd backend && uv add "celery[redis]" redis
```

**Step 2: Configure Celery**
Create `backend/app/core/celery_app.py`:
```python
from celery import Celery
from app.core.config import settings

celery_app = Celery("worker", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.task_routes = {"app.worker.test_celery": "main-queue"}
```

**Step 3: Add Redis Config**
Update `backend/app/core/config.py` to include `REDIS_URL`.

**Step 4: Create Worker Entry Point**
Create `backend/app/worker.py` with a test task.

### Task 1.2: Define Database Models (Production & Quality)
**Context:** Need models for Production Lines, Stations, and Defect Records.
**Files:**
- Modify: `backend/app/models.py`
- Create: `backend/app/alembic/versions/xxxx_add_production_models.py`

**Step 1: Add Models**
In `backend/app/models.py`, add:
- `ProductionLine` (id, name, status, target_output)
- `Station` (id, line_id, name, type)
- `DefectRecord` (id, station_id, type, severity, timestamp)

**Step 2: Create Migration**
```bash
cd backend
uv run alembic revision --autogenerate -m "Add production models"
uv run alembic upgrade head
```

## Phase 2: GuanLan (Production Portal) - Backend

### Task 2.1: Production Overview API
**Context:** APIs for dashboard metrics (yield rate, output, status).
**Files:**
- Create: `backend/app/api/routes/production.py`
- Modify: `backend/app/api/main.py`
- Test: `backend/tests/api/routes/test_production.py`

**Step 1: Write Failing Test**
Create `backend/tests/api/routes/test_production.py` testing `GET /api/v1/production/overview`.

**Step 2: Implement Route**
Create `backend/app/api/routes/production.py`. Implement endpoints:
- `GET /overview`: Returns aggregated stats (plan vs actual).
- `GET /lines`: List all production lines.

**Step 3: Register Router**
In `backend/app/api/main.py`, include `production_router`.

**Step 4: Verify**
Run `pytest backend/tests/api/routes/test_production.py`.

## Phase 3: GuanLan (Production Portal) - Frontend

### Task 3.1: Dashboard Layout & Navigation
**Context:** Create the shell for the application.
**Files:**
- Modify: `frontend/src/routes/__root.tsx` (Navigation)
- Create: `frontend/src/routes/dashboard.tsx`
- Create: `frontend/src/components/Sidebar.tsx`

**Step 1: Setup Routes**
Use TanStack Router to create `/dashboard` route.

**Step 2: Create Layout**
Implement a responsive sidebar layout using shadcn/ui components.

### Task 3.2: Production Overview Widgets
**Context:** Display charts for Production Output and Yield Rate.
**Files:**
- Create: `frontend/src/components/dashboard/ProductionChart.tsx`
- Create: `frontend/src/components/dashboard/YieldCard.tsx`
- Modify: `frontend/src/routes/dashboard.tsx`

**Step 1: Install Recharts (or ECharts)**
`npm install recharts` (React-friendly).

**Step 2: Implement Components**
Create dummy data charts first, then connect to API using TanStack Query.

## Phase 4: SiNan (Decision Support) - Core

### Task 4.1: Anomaly & Diagnosis Models
**Context:** Models for tracking anomalies and linking them to knowledge graph nodes (simplified as tables for MVP).
**Files:**
- Modify: `backend/app/models.py`
- Create: `backend/app/alembic/versions/xxxx_add_sinan_models.py`

**Step 1: Add Models**
- `Anomaly` (id, line_id, station_id, description, status)
- `Diagnosis` (id, anomaly_id, root_cause, confidence)
- `Solution` (id, diagnosis_id, title, description, roi_score)

**Step 2: Migration**
Run alembic migration.

### Task 4.2: Anomaly Management APIs
**Context:** CRUD for anomalies.
**Files:**
- Create: `backend/app/api/routes/anomalies.py`
- Modify: `backend/app/api/main.py`

**Step 1: Implement Endpoints**
- `GET /anomalies`: List active alerts.
- `POST /anomalies/{id}/diagnose`: Trigger diagnosis (mock or simple logic).

### Task 4.3: SiNan Frontend - Alert Center
**Context:** View for engineers to handle alerts.
**Files:**
- Create: `frontend/src/routes/alerts/index.tsx`
- Create: `frontend/src/routes/alerts/$alertId.tsx`

**Step 1: Alert List**
Table view of anomalies with status badges.

**Step 2: Diagnosis Detail**
Detail view showing the "Knowledge Graph" (can be a simple tree visualization using ReactFlow or similar) and Solution options.

## Phase 5: Integration

### Task 5.1: Real-time Updates (Mock)
**Context:** Production data should update live.
**Files:**
- Modify: `frontend/src/hooks/useProductionData.ts`

**Step 1: Polling**
Configure TanStack Query `refetchInterval` to 5 seconds for dashboard queries.

### Task 5.2: End-to-End Test
**Context:** Verify critical flow.
**Files:**
- Create: `frontend/tests/flow.spec.ts`

**Step 1: Write Playwright Test**
- Login
- View Dashboard
- Click an Alert
- View Solution

---

**Execution Instructions:**
1. Select **Subagent-Driven** execution.
2. Start with Task 1.1.
