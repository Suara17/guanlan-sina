# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**天工·弈控** 是一个面向离散制造业的"视-空协同"智适应操作系统,基于 1+N+X 生态架构:
- **1 (OS内核)**: 基础设施层 - 设备连接、数据采集、基础诊断
- **N (原子能力)**: 服务组件层 - 视觉算法、知识图谱、优化引擎等模块化能力
- **X (场景APP)**: 应用编排层 - 行业解决方案和低代码编排

技术栈: FastAPI + React + PostgreSQL + Redis + Celery

## 开发命令

### 数据库和后端

```bash
# 启动数据库(Docker)
docker compose up db -d

# 后端开发 docker启动
```

### 前端

```bash
cd frontend
npm install                          # 安装依赖
npm run dev                          # 启动开发服务器(localhost:3000)
npm run build                        # 生产构建
npm run preview                      # 预览构建结果
npm run generate-client              # 从OpenAPI规范生成类型化客户端
```

### Docker Compose 完整环境

```bash
docker compose watch                 # 启动完整开发环境(包含Traefik、Adminer等)
docker compose logs backend          # 查看后端日志
docker compose logs frontend         # 查看前端日志
docker compose down                  # 停止所有服务
```

### 数据库迁移

```bash
cd backend
uv run alembic revision --autogenerate -m "描述"  # 创建迁移
uv run alembic upgrade head                       # 应用迁移
uv run alembic downgrade -1                       # 回滚一步
```

## 架构说明

### 后端架构 (FastAPI)

```
backend/app/
├── main.py                 # FastAPI应用入口,配置CORS和路由
├── core/
│   ├── config.py          # Pydantic Settings配置(从.env读取)
│   ├── db.py              # 数据库会话管理
│   ├── security.py        # JWT认证和密码哈希
│   └── celery_app.py      # Celery异步任务配置
├── api/
│   ├── main.py            # API路由聚合器
│   ├── deps.py            # 依赖注入(数据库会话、认证token)
│   └── routes/            # API路由模块
│       ├── login.py       # 用户登录
│       ├── users.py       # 用户管理
│       ├── production.py  # 生产数据
│       ├── anomalies.py   # 异常检测
│       ├── solutions.py   # 解决方案
│       └── cases.py       # 案例管理
├── models.py              # SQLModel数据库模型
├── crud.py                # CRUD操作
└── worker.py              # Celery后台任务
```

**关键设计模式:**
- **依赖注入**: 通过`deps.py`提供`get_db`和`get_current_user`等依赖
- **配置管理**: 使用`pydantic-settings`从`.env`读取配置,支持环境变量覆盖
- **异步任务**: Celery + Redis处理后台任务(如数据聚合、报告生成)
- **认证**: JWT token-based认证,通过HTTP Bearer header传递

### 前端架构 (React + TypeScript)

```
frontend/
├── src/
│   ├── client/            # 自动生成的API客户端
│   │   ├── client.gen.ts  # API客户端函数
│   │   ├── types.gen.ts   # TypeScript类型定义
│   │   └── sdk.gen.ts     # SDK类型
│   └── index.ts           # 客户端入口
├── openapi.yaml           # OpenAPI规范(用于生成客户端)
└── package.json
```

**前端开发说明:**
- API客户端通过`npm run generate-client`从OpenAPI规范自动生成
- 使用Vite作为开发服务器和构建工具
- 后端API地址通过环境变量`VITE_API_URL`配置

### 数据库设计

- **PostgreSQL**: 主数据库,存储业务数据
- **Alembic**: 数据库迁移工具,版本文件在`backend/app/alembic/versions/`
- **SQLModel**: ORM层,结合Pydantic和SQLAlchemy

### 服务通信

- **API通信**: RESTful API,前端的`/api/v1/*`请求通过Traefik代理到后端
- **实时通信**: WebSocket(用于司南助手实时提醒)
- **异步任务**: Celery任务队列,Redis作为broker

## 环境配置

### 关键环境变量 (.env)

```bash
# 项目配置
PROJECT_NAME=天工·弈控
ENVIRONMENT=local  # local/staging/production
STACK_NAME=guanlan-sina
DOMAIN=localhost.tiangolo.com  # 生产环境使用实际域名

# 数据库
POSTGRES_SERVER=db      # Docker中使用服务名,本地使用localhost
POSTGRES_PORT=5432
POSTGRES_USER=app
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app

# 认证
SECRET_KEY=changethis          # 生产环境必须更改
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis
ACCESS_TOKEN_EXPIRE_MINUTES=11520  # 8天

# CORS
FRONTEND_HOST=http://localhost:5173
BACKEND_CORS_ORIGINS=http://localhost:5173

# Redis和Celery
REDIS_URL=redis://localhost:6379/0

# SMTP(可选,用于邮件功能)
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=

# Sentry(可选,用于错误追踪)
SENTRY_DSN=
```

### Docker Compose网络

- **traefik-public**: Traefik反向代理网络,用于生产环境
- **default**: 内部服务网络(db、backend、frontend互通)

## 开发工作流

### 添加新的API端点

1. 在`backend/app/api/routes/`创建或修改路由文件
2. 在`backend/app/api/main.py`注册路由
3. 运行`uv run alembic revision --autogenerate -m "描述"`创建数据库迁移
4. 更新`frontend/openapi.yaml`(或让后端自动生成)
5. 运行`npm run generate-client`生成前端客户端
6. 在前端使用生成的客户端函数调用API

### 本地开发 vs Docker开发

**本地开发**:
- 后端: `fastapi dev app/main.py` (端口8000)
- 前端: `npm run dev` (端口3000)
- 数据库: `docker compose up db -d` (端口5432)

**Docker开发**:
- 使用`docker compose watch`,所有服务在容器中运行
- 支持热重载,代码更改自动同步到容器
- Traefik提供子域名路由(api.localhost.tiangolo.com、dashboard.localhost.tiangolo.com)

### 测试和代码质量

```bash
# 后端测试
cd backend
uv run pytest --cov=app                    # 测试并生成覆盖率报告
uv run mypy                                # 类型检查(严格模式)
uv run ruff check .                        # Lint检查

# 前端测试(需配置)
cd frontend
npm run test                               # 运行测试

# Pre-commit钩子
# 安装: uv run pre-commit install
# 手动运行: uv run pre-commit run --all-files
```

## 常见问题

### 数据库连接失败
- 确认PostgreSQL容器正在运行: `docker ps | grep postgres`
- 检查`.env`中的数据库配置
- 确认数据库迁移已应用: `uv run alembic current`

### CORS错误
- 检查`backend/app/core/config.py`中的`BACKEND_CORS_ORIGINS`配置
- 确认前端地址(如`http://localhost:5173`)在CORS列表中

### 前端API调用失败
- 确认后端服务正在运行(localhost:8000)
- 检查浏览器控制台的网络请求URL
- 确认`VITE_API_URL`环境变量配置正确

### Celery任务不执行
- 确认Redis正在运行: `docker ps | grep redis`
- 启动Celery worker: `cd backend && uv run celery -A app.worker.celery_app worker --loglevel=info`

## 核心业务概念

### 司南助手
- **定位**: AI驱动的虚拟助手,负责异常提醒、归因分析、解决方案推荐
- **实现**: WebSocket实时推送 + 前端动画组件
- **集成**: 调用格物(知识图谱归因)和天筹(优化决策)模块

### 生产可视化面板
- **核心指标**: 计划vs实时产量、整体不良品率、异常信息流
- **数据源**: `/api/v1/production/metrics`接口
- **实时更新**: WebSocket推送或前端轮询

### 原子能力模块化
- **视觉检测**: MSA-YOLO算法容器
- **知识图谱**: 格物归因分析
- **优化引擎**: 天筹决策优化
- **仿真引擎**: 浑天仿真模拟

### API版本控制
- 所有API端点前缀: `/api/v1/`
- OpenAPI文档: `http://localhost:8000/docs` (Swagger UI)
- 替代文档: `http://localhost:8000/redoc` (ReDoc)

## 项目特色

1. **模板基础**: 基于[tiangolo/full-stack-fastapi-postgresql](https://github.com/tiangolo/full-stack-fastapi-postgresql)模板
2. **类型安全**: 前后端全类型化,自动生成TypeScript客户端
3. **容器化**: 完整的Docker Compose配置,支持一键部署
4. **可观测性**: 集成Sentry错误追踪和性能监控
5. **邮件功能**: 支持SMTP邮件发送(如密码重置、告警通知)
6. **异步任务**: Celery处理后台任务,如数据聚合、报告生成
