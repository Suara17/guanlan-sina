# 观澜-司南可视化平台实施计划

> **致 Claude:** 需要子技能：使用 superpowers:executing-plans 逐个任务实施此计划。

**目标:** 使用 FastAPI 和 React 构建“观澜”（生产可视化）和“司南”（决策支持）系统。

**架构:** Monorepo，包含 `backend` (FastAPI + SQLModel + PostgreSQL) 和 `frontend` (React + TanStack Router + Tailwind)。通过 WebSocket（MVP 阶段可能使用轮询）进行实时更新。

**技术栈:**
- **后端:** Python 3.10+, FastAPI, SQLModel, PostgreSQL, Celery (待添加), Redis (待添加).
- **前端:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui.

---

## 第一阶段：基础设施与核心后端

### 任务 1.1：添加 Celery 和 Redis 支持
**背景:** 设计需要异步任务（通知、仿真），但 `pyproject.toml` 中缺少 Celery。
**文件:**
- 修改: `backend/pyproject.toml`
- 创建: `backend/app/core/celery_app.py`
- 修改: `backend/app/core/config.py`
- 创建: `backend/app/worker.py`

**步骤 1: 添加依赖**
添加 `celery[redis]` 和 `redis` 到 `backend/pyproject.toml`。
```bash
cd backend && uv add "celery[redis]" redis
```

**步骤 2: 配置 Celery**
创建 `backend/app/core/celery_app.py`:
```python
from celery import Celery
from app.core.config import settings

celery_app = Celery("worker", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.task_routes = {"app.worker.test_celery": "main-queue"}
```

**步骤 3: 添加 Redis 配置**
更新 `backend/app/core/config.py` 以包含 `REDIS_URL`。

**步骤 4: 创建 Worker 入口点**
创建 `backend/app/worker.py` 并包含一个测试任务。

### 任务 1.2：定义数据库模型（生产与质量）
**背景:** 需要生产线、工位和缺陷记录的模型。
**文件:**
- 修改: `backend/app/models.py`
- 创建: `backend/app/alembic/versions/xxxx_add_production_models.py`

**步骤 1: 添加模型**
在 `backend/app/models.py` 中添加:
- `ProductionLine` (id, name, status, target_output)
- `Station` (id, line_id, name, type)
- `DefectRecord` (id, station_id, type, severity, timestamp)

**步骤 2: 创建迁移**
```bash
cd backend
uv run alembic revision --autogenerate -m "Add production models"
uv run alembic upgrade head
```

## 第二阶段：观澜（生产门户）- 后端

### 任务 2.1：生产总览 API
**背景:** 仪表盘指标（良率、产量、状态）的 API。
**文件:**
- 创建: `backend/app/api/routes/production.py`
- 修改: `backend/app/api/main.py`
- 测试: `backend/tests/api/routes/test_production.py`

**步骤 1: 编写失败测试**
创建 `backend/tests/api/routes/test_production.py` 测试 `GET /api/v1/production/overview`。

**步骤 2: 实现路由**
创建 `backend/app/api/routes/production.py`。实现端点:
- `GET /overview`: 返回聚合统计数据（计划 vs 实际）。
- `GET /lines`: 列出所有生产线。

**步骤 3: 注册路由**
在 `backend/app/api/main.py` 中包含 `production_router`。

**步骤 4: 验证**
运行 `pytest backend/tests/api/routes/test_production.py`。

## 第三阶段：观澜（生产门户）- 前端

### 任务 3.1：仪表盘布局与导航
**背景:** 创建应用程序的外壳。
**文件:**
- 修改: `frontend/src/routes/__root.tsx` (导航)
- 创建: `frontend/src/routes/dashboard.tsx`
- 创建: `frontend/src/components/Sidebar.tsx`

**步骤 1: 设置路由**
使用 TanStack Router 创建 `/dashboard` 路由。

**步骤 2: 创建布局**
使用 shadcn/ui 组件实现响应式侧边栏布局。

### 任务 3.2：生产总览小部件
**背景:** 显示生产产量和良率的图表。
**文件:**
- 创建: `frontend/src/components/dashboard/ProductionChart.tsx`
- 创建: `frontend/src/components/dashboard/YieldCard.tsx`
- 修改: `frontend/src/routes/dashboard.tsx`

**步骤 1: 安装 Recharts (或 ECharts)**
`npm install recharts` (React 友好)。

**步骤 2: 实现组件**
首先创建虚拟数据图表，然后使用 TanStack Query 连接到 API。

## 第四阶段：司南（决策支持）- 核心

### 任务 4.1：异常与诊断模型
**背景:** 用于跟踪异常并将其链接到知识图谱节点的模型（MVP 简化为表）。
**文件:**
- 修改: `backend/app/models.py`
- 创建: `backend/app/alembic/versions/xxxx_add_sinan_models.py`

**步骤 1: 添加模型**
- `Anomaly` (id, line_id, station_id, description, status)
- `Diagnosis` (id, anomaly_id, root_cause, confidence)
- `Solution` (id, diagnosis_id, title, description, roi_score)

**步骤 2: 迁移**
运行 alembic 迁移。

### 任务 4.2：异常管理 API
**背景:** 异常的 CRUD。
**文件:**
- 创建: `backend/app/api/routes/anomalies.py`
- 修改: `backend/app/api/main.py`

**步骤 1: 实现端点**
- `GET /anomalies`: 列出活动警报。
- `POST /anomalies/{id}/diagnose`: 触发诊断（模拟或简单逻辑）。

### 任务 4.3：司南前端 - 警报中心
**背景:** 工程师处理警报的视图。
**文件:**
- 创建: `frontend/src/routes/alerts/index.tsx`
- 创建: `frontend/src/routes/alerts/$alertId.tsx`

**步骤 1: 警报列表**
带有状态徽章的异常表格视图。

**步骤 2: 诊断详情**
显示“知识图谱”（可以使用 ReactFlow 或类似工具进行简单的树形可视化）和解决方案选项的详细视图。

## 第五阶段：集成

### 任务 5.1：实时更新（模拟）
**背景:** 生产数据应实时更新。
**文件:**
- 修改: `frontend/src/hooks/useProductionData.ts`

**步骤 1: 轮询**
将仪表盘查询的 TanStack Query `refetchInterval` 配置为 5 秒。

### 任务 5.2：端到端测试
**背景:** 验证关键流程。
**文件:**
- 创建: `frontend/tests/flow.spec.ts`

**步骤 1: 编写 Playwright 测试**
- 登录
- 查看仪表盘
- 点击警报
- 查看解决方案

---

**执行说明:**
1. 选择 **Subagent-Driven** 执行。
2. 从任务 1.1 开始。
