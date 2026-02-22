# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**天工·弈控** 是一个面向离散制造业的"视-空协同"智适应操作系统,基于 1+N+X 生态架构:
- **1 (OS内核)**: 基础设施层 - 设备连接、数据采集、基础诊断
- **N (原子能力)**: 服务组件层 - 视觉算法、知识图谱、优化引擎等模块化能力
- **X (场景APP)**: 应用编排层 - 行业解决方案和低代码编排

**技术栈:**
- **后端**: Python 3.10+ (FastAPI, SQLModel, PostgreSQL, Redis, Celery), uv (依赖管理)
- **前端**: React 19 (Vite 6, TypeScript 5.8, Tailwind CSS, Biome, Recharts)
- **数据库**: PostgreSQL (主数据库), Neo4j (知识图谱)
- **AI/LLM**: Google GenAI (Gemini) 集成

## 开发命令

### 数据库和后端

```bash
# 启动后端和数据库(Docker)
docker compose up -d db backend

# 启动完整开发环境(包含Neo4j知识图谱)
docker compose up -d

# 查看后端日志
docker compose logs -f backend

# 查看Neo4j知识图谱日志
docker compose logs -f neo4j
```

### 前端

```bash
cd frontend
npm install                          # 安装依赖
npm run dev                          # 启动开发服务器(localhost:3000)
npm run build                        # 生产构建
npm run preview                      # 预览构建结果
npm run generate-client              # 从OpenAPI规范生成类型化客户端
npm run lint                         # 运行Biome代码检查和格式化
```

### Docker Compose 完整环境

```bash
docker compose up                    # 启动完整开发环境(包含Traefik、Adminer、Neo4j等)
docker compose logs backend          # 查看后端日志
docker compose logs frontend         # 查看前端日志
docker compose logs neo4j            # 查看Neo4j知识图谱日志
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
│   ├── config.py           # Pydantic Settings配置
│   ├── db.py               # 数据库会话管理
│   ├── security.py         # JWT认证和密码哈希
│   └── celery_app.py       # Celery异步任务配置
├── api/
│   ├── main.py             # API路由聚合器
│   ├── deps.py             # 依赖注入
│   └── routes/             # API路由模块
│       ├── login.py        # 认证登录
│       ├── users.py        # 用户管理
│       ├── production.py   # 生产数据
│       ├── anomalies.py    # 异常检测
│       ├── solutions.py    # 解决方案
│       ├── cases.py        # 案例管理
│       ├── items.py        # 通用条目
│       ├── private.py      # 私有路由
│       ├── utils.py        # 工具路由
│       ├── tianchou.py    # 天筹决策优化API
│       └── knowledge_graph.py # 知识图谱路由
├── algorithms/             # 算法模块
│   ├── part1_optimization.py  # 优化算法
│   ├── part2_decision.py      # 决策算法
│   └── scheme_translator.py   # 方案翻译器
├── services/               # 服务层
│   └── neo4j_service.py    # Neo4j知识图谱服务
├── models.py               # SQLModel数据库模型
├── crud.py                 # CRUD操作
├── worker.py               # Celery后台任务
└── scripts/                # 脚本工具
    └── migrate_to_neo4j.py # 数据迁移脚本
```

### 前端架构 (React 19 + TypeScript)

```
frontend/
├── src/                    # 自动生成代码
│   ├── client/             # API客户端 (OpenAPI TS自动生成)
│   ├── api/                # API模块
│   └── index.css           # 全局样式
├── components/             # 通用组件
│   ├── AiAssistant.tsx     # AI助手组件
│   ├── AnomalyList.tsx     # 异常列表组件
│   ├── DataDashboard.tsx   # 数据仪表盘
│   ├── KnowledgeGraphCanvas.tsx # 知识图谱画布
│   ├── LandingPage.tsx     # 落地页
│   ├── LayoutVisualizer.tsx # 设备布局可视化
│   ├── DeviceLayoutVisualizer.tsx # 设备布局可视化器
│   ├── AGVLayoutVisualizer.tsx    # AGV布局可视化器
│   ├── AGVPathVisualizer.tsx      # AGV路径可视化
│   ├── AGVPerformancePanel.tsx    # AGV性能面板
│   ├── LoadingSpinner.tsx  # 加载动画
│   ├── LoginPage.tsx       # 登录页组件
│   ├── NodeDetailPanel.tsx # 节点详情面板
│   ├── ProductionLineSelector.tsx # 产线选择器
│   ├── ProtectedRoute.tsx  # 路由保护
│   ├── Sidebar.tsx         # 侧边栏
│   ├── SinanAvatar.tsx     # 司南数字人
│   ├── SubscriptionValueReview.tsx # 订阅值审核
│   ├── TiangongLogo.tsx    # 天工Logo
│   └── TopBar.tsx          # 顶部导航
├── pages/                  # 页面视图
│   ├── Dashboard.tsx       # 总览看板
│   ├── Huntian.tsx         # 浑天(验证层)
│   ├── KernelConnect.tsx   # 内核连接
│   ├── KnowledgeGraph.tsx  # 知识图谱(格物)
│   ├── Marketplace.tsx     # 能力市场
│   ├── ScenarioBuilder.tsx # 场景编排
│   ├── SinanAnalysis.tsx   # 司南分析
│   ├── SubscriptionValue.tsx # 订阅值管理
│   ├── Tianchou.tsx        # 天筹页面入口
│   ├── Tianchou/           # 天筹(决策层) - 页面模块
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── TaskProgress.tsx
│   │       ├── ParetoFrontChart.tsx
│   │       ├── ParetoTriplot.tsx
│   │       ├── TaskConfigForm.tsx
│   │       ├── AHPWizard.tsx
│   │       └── SolutionCard.tsx
│   └── Zhixing/            # 智行(执行层) - 页面模块
│       ├── index.tsx
│       └── components/
│           ├── ExecutionProgress.tsx
│           ├── MachineDiagram.tsx
│           └── RealTimeLogs.tsx
├── services/               # 服务层
│   ├── geminiService.ts    # Google GenAI服务集成
│   ├── neo4jService.ts     # Neo4j图数据库服务
│   ├── dataAdapter.ts      # 数据适配器
│   └── cacheService.ts     # 缓存服务
├── contexts/
│   └── AuthContext.tsx     # 认证上下文(持久化登录)
├── hooks/
│   └── useAuth.tsx         # 认证Hook
├── App.tsx                 # 根组件
├── index.tsx               # 应用入口
├── types.ts                # 全局类型定义
├── constants.ts            # 常量定义
└── mockData.ts             # 模拟数据
```

**前端开发规范:**
- **代码风格**: 使用 Biome (`npm run lint`) 进行代码格式化和 Lint 检查。
- **API集成**: 使用 `npm run generate-client` 自动生成客户端，避免手写 fetch 请求。
- **组件库**: 基于 Tailwind CSS 自定义样式，使用 Lucide React 图标。
- **状态管理**: 使用 Context API (AuthContext) 管理全局状态。

### 数据库设计

- **PostgreSQL**: 主数据库,存储业务数据
- **Neo4j**: 知识图谱数据库,存储异常关联关系、根因分析等
- **Alembic**: 数据库迁移工具
- **SQLModel**: ORM层 (Pydantic + SQLAlchemy)

### 服务通信

- **RESTful API**: `/api/v1/*` (Traefik 代理)
- **WebSocket**: 实时通信支持
- **Celery**: 异步任务队列 (Redis Broker)

## 环境配置

### 关键环境变量 (.env)

```bash
# 项目配置
PROJECT_NAME=天工·弈控
ENVIRONMENT=local
STACK_NAME=guanlan-sina
DOMAIN=localhost.tiangolo.com

# 数据库
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=app
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app

# Neo4j知识图谱配置
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
NEO4J_BROWSER_URL=http://localhost:7474

# 认证
SECRET_KEY=changethis
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# CORS
FRONTEND_HOST=http://localhost:5173
BACKEND_CORS_ORIGINS=http://localhost:5173

# Redis和Celery
REDIS_URL=redis://localhost:6379/0
```

## 开发工作流

### 添加新的API端点

1. 在`backend/app/api/routes/`创建或修改路由文件
2. 在`backend/app/api/main.py`注册路由
3. 运行`uv run alembic revision --autogenerate -m "描述"`创建数据库迁移
4. 更新`frontend/openapi.yaml`
5. 运行`npm run generate-client`生成前端客户端

### 测试和代码质量

```bash
# 后端
cd backend
uv run pytest --cov=app     # 测试
uv run mypy                 # 类型检查
uv run ruff check .         # Lint

# 前端
cd frontend
npm run lint                # Biome Check
```

## 项目文档索引

### 核心设计文档

| 文档路径 | 说明 |
|---------|------|
| [13-天筹和浑天模块页面设计.md](./13-天筹和浑天模块页面设计.md) | 决策层(天筹)与验证层(浑天)的详细页面设计方案 |
| [01-OS开发设计方案.md](./01-OS开发设计方案.md) | 操作系统整体开发设计方案 |
| [02-系统规划书.docx](./02-系统规划书.docx) | 系统整体规划说明书 |

### 后端文档

| 文档路径 | 说明 |
|---------|------|
| [backend/README.md](./backend/README.md) | 后端说明、Docker配置、迁移指南 |
| [backend/app/README.md](./backend/app/README.md) | 应用核心结构说明 |
| [backend/app/api/README.md](./backend/app/api/README.md) | API路由定义说明 |

### 前端文档

| 文档路径 | 说明 |
|---------|------|
| [frontend/README.md](./frontend/README.md) | 前端项目说明、快速开始 |
| [frontend/components/README.md](./frontend/components/README.md) | 组件库说明 |
| [frontend/contexts/AUTH_SYSTEM_README.md](./frontend/contexts/AUTH_SYSTEM_README.md) | 认证系统实现说明 |

### 运维与部署

| 文档路径 | 说明 |
|---------|------|
| [03-deployment.md](./03-deployment.md) | 部署指南 |
| [07-启动指南.md](./07-启动指南.md) | 项目启动指南 |
| [12-数据库管理指南.md](./12-数据库管理指南.md) | 数据库管理与维护指南 |

### 知识图谱相关

| 文档路径 | 说明 |
|---------|------|
| [frontend/pages/KnowledgeGraph.tsx](./frontend/pages/KnowledgeGraph.tsx) | 知识图谱页面实现 |
| [backend/app/api/routes/knowledge_graph.py](./backend/app/api/routes/knowledge_graph.py) | 知识图谱API路由 |
| [backend/app/models.py](./backend/app/models.py) | 包含知识图谱相关的数据模型 |

---

*本文档版本: 1.3 | 更新日期: 2026-02-22 | 项目: 天工·弈控*
