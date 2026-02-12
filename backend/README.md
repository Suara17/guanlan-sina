# Guanlan-Sina 后端服务

## 项目概述

Guanlan-Sina 是一个智能生产管理系统，专注于制造业的生产监控、异常检测、质量管理和解决方案推荐。后端服务基于 FastAPI 框架构建，提供 RESTful API 接口，支持用户认证、生产数据管理、异常分析和案例库管理等功能。

### 核心功能

- **用户管理**：用户注册、登录、权限管理、角色控制
- **生产管理**：产线管理、工作站管理、生产计划、生产记录、质量指标、缺陷详情
- **异常分析**：异常检测、根因诊断、解决方案推荐、工作订单管理
- **案例库**：案例收集、经验积累、知识复用
- **知识图谱**：基于 Neo4j 的知识图谱系统，支持异常分析、相似性匹配、解决方案推荐和产线健康分析
- **审计日志**：操作记录、安全审计
- **Excel集成**：支持从Excel导入数据创建知识图谱

### 技术栈

- **Web 框架**：FastAPI 0.114+ (with Standard Distribution)
- **数据库**：PostgreSQL + SQLModel + Alembic
- **图数据库**：Neo4j (用于知识图谱)
- **缓存/消息队列**：Redis + Celery
- **认证**：JWT (PyJWT) + Passlib (bcrypt)
- **Excel处理**：openpyxl
- **测试**：Pytest + Coverage
- **代码质量**：Ruff + MyPy + basedpyright
- **包管理**：uv
- **邮件发送**：emails + Jinja2

## 环境要求

- Python 3.10+
- Docker & Docker Compose
- uv (Python 包管理器)
- Neo4j (可选，用于知识图谱功能)

## 快速开始

#### 1. 克隆项目

```bash
git clone <repository-url>
cd backend
```

#### 2. 安装 uv (如果尚未安装)

```bash
# Windows
winget install uv

# macOS
brew install uv

# 或者使用 pip
pip install uv
```

#### 3. 配置环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`），配置以下关键参数：

```env
PROJECT_NAME=Guanlan-Sina
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
POSTGRES_DB=guanlan
REDIS_URL=redis://localhost:6379/0
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
```

#### 4. 安装依赖并启动服务

```bash
# 同步依赖
uv sync

# 激活虚拟环境
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate  # Windows

# 数据库迁移
alembic upgrade head

# 启动开发服务器
fastapi dev app/main.py
```

### 超级管理员凭据

前端登录时使用的默认超级管理员凭据：

- **邮箱**: `admin@example.com`
- **密码**: `changethis`

⚠️ **安全提示**: 在生产环境中，请务必修改 `.env` 文件中的 `FIRST_SUPERUSER_PASSWORD` 为强密码。

## Docker 部署

### 启动所有服务

在项目根目录执行：

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 开发模式（带热重载）
docker compose watch
```

### 停止所有服务

```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷
docker compose down -v

# 停止并删除容器、网络、卷和镜像
docker compose down --rmi all -v
```

### 单独管理服务

```bash
# 启动特定服务
docker compose up -d postgres redis

# 停止特定服务
docker compose stop backend

# 重启特定服务
docker compose restart backend

# 进入后端容器
docker compose exec backend bash

# 在容器内运行开发服务器
docker compose exec backend fastapi run --reload app/main.py
```

### Adminer 数据库管理

Adminer 是一个轻量级的数据库管理工具，可以方便地管理 PostgreSQL 数据库。

```bash
# 使用 Docker Compose 启动 Adminer 服务（端口 8080）
docker compose up -d adminer

# 访问 Adminer 界面
# 浏览器打开: http://localhost:8080
# 登录信息:
#   系统: PostgreSQL
#   服务器: db
#   用户名: app (根据 .env 配置)
#   密码: changethis (根据 .env 配置)
#   数据库: app (根据 .env 配置)

# 停止 Adminer
docker compose stop adminer

# 查看 Adminer 日志
docker compose logs -f adminer
```

### 删除服务

```bash
# 删除所有容器
docker compose rm -f

# 删除特定服务容器
docker compose rm -f backend

# 删除所有容器、网络和卷
docker compose down -v

# 完全清理（包括镜像）
docker compose down --rmi all -v
```

## API 端点

### 认证相关
- `POST /api/v1/login/access-token` - 用户登录
- `POST /api/v1/login/test-token` - 测试令牌
- `POST /api/v1/login/recover-password` - 恢复密码
- `POST /api/v1/login/reset-password` - 重置密码

### 用户管理
- `GET /api/v1/users/` - 获取用户列表
- `POST /api/v1/users/` - 创建用户
- `GET /api/v1/users/{user_id}` - 获取用户详情
- `PUT /api/v1/users/{user_id}` - 更新用户
- `DELETE /api/v1/users/{user_id}` - 删除用户
- `GET /api/v1/users/me` - 获取当前用户信息
- `PUT /api/v1/users/me` - 更新当前用户信息

### 生产管理
- `GET /api/v1/production/lines` - 获取产线列表
- `POST /api/v1/production/lines` - 创建产线
- `GET /api/v1/production/lines/{line_id}` - 获取产线详情
- `GET /api/v1/production/overview` - 获取生产概览
- `GET /api/v1/production/dashboard` - 获取生产看板数据（需要日期参数）
- `GET /api/v1/production/plans` - 获取生产计划
- `POST /api/v1/production/plans` - 创建生产计划
- `GET /api/v1/production/records` - 获取生产记录
- `POST /api/v1/production/records` - 创建生产记录

### 异常管理
- `GET /api/v1/anomalies/` - 获取异常列表
- `POST /api/v1/anomalies/` - 创建异常
- `GET /api/v1/anomalies/{anomaly_id}` - 获取异常详情
- `PUT /api/v1/anomalies/{anomaly_id}` - 更新异常
- `POST /api/v1/anomalies/{anomaly_id}/diagnose` - 诊断异常

### 解决方案管理
- `GET /api/v1/solutions/` - 获取解决方案列表
- `POST /api/v1/solutions/` - 创建解决方案
- `GET /api/v1/solutions/{solution_id}` - 获取解决方案详情
- `PUT /api/v1/solutions/{solution_id}` - 更新解决方案

### 案例库管理
- `GET /api/v1/cases/` - 获取案例列表
- `POST /api/v1/cases/` - 创建案例
- `GET /api/v1/cases/{case_id}` - 获取案例详情
- `PUT /api/v1/cases/{case_id}` - 更新案例

### 知识图谱管理 (Neo4j)
- `GET /api/v1/knowledge-graph/graph/line/{line_type}` - 获取特定产线的完整知识图谱
- `GET /api/v1/knowledge-graph/analysis/anomaly/{sequence}` - 获取异常完整分析
- `POST /api/v1/knowledge-graph/similarity/anomalies` - 基于异常现象查找相似问题
- `GET /api/v1/knowledge-graph/recommendations/solutions` - 基于当前条件推荐解决方案
- `GET /api/v1/knowledge-graph/health/line/{line_type}` - 分析产线健康状况
- `GET /api/v1/knowledge-graph/statistics/solutions` - 获取解决方案统计信息
- `GET /api/v1/knowledge-graph/analysis/root-causes/{line_type}` - 获取根本原因分析
- `POST /api/v1/knowledge-graph/sync/anomalies` - 从 PostgreSQL 同步异常数据到 Neo4j

## 数据库迁移

### 创建迁移

```bash
# 进入后端容器或激活虚拟环境后执行
alembic revision --autogenerate -m "描述迁移内容"
```

### 执行迁移

```bash
# 升级到最新版本
alembic upgrade head

# 降级到指定版本
alembic downgrade <revision_id>

# 查看迁移历史
alembic history

# 查看当前版本
alembic current
```

## 测试

### 运行所有测试

```bash
# 本地环境
bash ./scripts/test.sh

# Docker 环境
docker compose exec backend bash scripts/tests-start.sh
```

### 运行特定测试

```bash
# 运行特定测试文件
pytest tests/api/test_users.py

# 运行特定测试函数
pytest tests/api/test_users.py::test_create_user

# 在第一个错误时停止
pytest -x

# 显示详细输出
pytest -v

# 生成覆盖率报告
pytest --cov=app --cov-report=html
```

### 查看测试覆盖率

测试完成后，在浏览器中打开 `htmlcov/index.html` 查看覆盖率报告。

## 代码质量

### 代码格式化

```bash
bash ./scripts/format.sh
```

### 代码检查

```bash
bash ./scripts/lint.sh
```

### 类型检查

```bash
mypy app/
```

### 静态类型检查

```bash
basedpyright
```

## 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── models.py               # SQLModel 数据模型
│   ├── crud.py                 # CRUD 操作
│   ├── utils.py                # 工具函数
│   ├── worker.py               # Celery 任务
│   ├── backend_pre_start.py    # 后端预启动脚本
│   ├── initial_data.py         # 初始数据
│   ├── insert_production_lines.py # 插入产线数据
│   ├── seed_data.py            # 种子数据
│   ├── tests_pre_start.py      # 测试预启动脚本
│   ├── api/                    # API 路由
│   │   ├── main.py
│   │   ├── deps.py             # 依赖注入
│   │   └── routes/             # 路由模块
│   │       ├── login.py        # 登录认证
│   │       ├── users.py        # 用户管理
│   │       ├── production.py   # 生产管理
│   │       ├── anomalies.py    # 异常管理
│   │       ├── solutions.py    # 解决方案
│   │       ├── cases.py        # 案例库
│   │       ├── items.py        # 示例项目
│   │       ├── knowledge_graph.py # 知识图谱
│   │       ├── private.py      # 私有接口
│   │       └── utils.py        # 工具接口
│   ├── core/                   # 核心配置
│   │   ├── config.py           # 配置管理
│   │   ├── celery_app.py       # Celery 配置
│   └── services/               # 业务服务
│       └── neo4j_service.py    # Neo4j 服务
├── tests/                      # 测试文件
│   ├── api/
│   ├── crud/
│   ├── utils/
│   └── websocket/
├── scripts/                    # 脚本文件
│   ├── format.sh               # 格式化脚本
│   ├── lint.sh                 # 代码检查脚本
│   ├── test.sh                 # 测试脚本
│   ├── prestart.sh             # 预启动脚本
│   └── tests-start.sh          # 测试启动脚本
├── alembic/                    # 数据库迁移
│   ├── env.py
│   └── versions/               # 迁移版本
├── Dockerfile                  # Docker 镜像配置
├── docker-compose.yml          # Docker Compose 配置
├── pyproject.toml              # 项目配置
├── alembic.ini                 # Alembic 配置
└── README.md                   # 项目文档
```

## 开发指南

### 添加新的 API 端点

1. 在 `app/api/routes/` 中创建新的路由文件
2. 在 `app/api/main.py` 中注册路由
3. 在 `app/models.py` 中定义数据模型
4. 在 `app/crud.py` 中添加 CRUD 操作
5. 在 `tests/api/` 中添加测试

### 修改数据模型

1. 在 `app/models.py` 中修改模型
2. 创建新的数据库迁移：`alembic revision --autogenerate -m "描述"`
3. 执行迁移：`alembic upgrade head`
4. 更新相关的 CRUD 操作和 API 端点

### 添加 Celery 任务

1. 在 `app/worker.py` 中定义任务函数
2. 在 `app/core/celery_app.py` 中配置任务路由
3. 启动 Celery Worker 处理任务

### 知识图谱功能开发

1. 在 `app/services/neo4j_service.py` 中实现 Neo4j 相关业务逻辑
2. 在 `app/api/routes/knowledge_graph.py` 中定义 API 端点
3. 在 `app/core/config.py` 中配置 Neo4j 连接参数
4. 在 `app/api/main.py` 中注册知识图谱路由

## VS Code 配置

项目已配置 VS Code 调试和测试支持：

- 使用 F5 启动调试器，可以设置断点、暂停和探索变量
- 通过 VS Code Python 测试选项卡运行测试
- 确保编辑器使用正确的 Python 解释器：`backend/.venv/bin/python`

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PROJECT_NAME` | 项目名称 | - |
| `API_V1_STR` | API 版本前缀 | `/api/v1` |
| `SECRET_KEY` | JWT 密钥 | 自动生成 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 访问令牌过期时间（分钟） | 11520 |
| `FRONTEND_HOST` | 前端主机地址 | `http://localhost:3000` |
| `ENVIRONMENT` | 运行环境 | `local` |
| `BACKEND_CORS_ORIGINS` | CORS 允许的源 | `[]` |
| `SENTRY_DSN` | Sentry DSN | `None` |
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379/0` |
| `POSTGRES_SERVER` | PostgreSQL 服务器地址 | - |
| `POSTGRES_PORT` | PostgreSQL 端口 | `5432` |
| `POSTGRES_USER` | PostgreSQL 用户名 | - |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | - |
| `POSTGRES_DB` | PostgreSQL 数据库名 | - |
| `SMTP_HOST` | SMTP 服务器地址 | `None` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | `None` |
| `SMTP_PASSWORD` | SMTP 密码 | `None` |
| `EMAILS_FROM_EMAIL` | 发件人邮箱 | `None` |
| `EMAILS_FROM_NAME` | 发件人名称 | 项目名称 |
| `FIRST_SUPERUSER` | 首个超级管理员邮箱 | - |
| `FIRST_SUPERUSER_PASSWORD` | 首个超级管理员密码 | - |
| `NEO4J_URI` | Neo4j 连接地址 | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j 用户名 | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j 密码 | `password` |
| `NEO4J_DATABASE` | Neo4j 数据库名 | `neo4j` |

## 故障排查

### 数据库连接失败

检查 PostgreSQL 服务是否运行：
```bash
docker compose ps postgres
```

### Redis 连接失败

检查 Redis 服务是否运行：
```bash
docker compose ps redis
```

### Neo4j 连接失败

检查 Neo4j 服务是否运行：
```bash
docker compose ps neo4j
```

### 迁移失败

检查数据库连接配置是否正确，然后重新运行迁移：
```bash
alembic upgrade head
```

### 测试失败

确保所有服务都在运行：
```bash
docker compose up -d
```

然后重新运行测试。

## 知识图谱功能

本项目集成了基于 Neo4j 的知识图谱系统，支持以下功能：

- **异常分析**：分析异常现象、根本原因和解决方案
- **相似性匹配**：基于异常现象查找历史相似问题
- **解决方案推荐**：根据产线类型和严重程度推荐最佳解决方案
- **产线健康分析**：评估产线的整体健康状况
- **统计分析**：提供解决方案使用情况和效果统计
- **根因分析**：识别常见根本原因及其影响

要启用知识图谱功能，请确保在环境变量中正确配置了 Neo4j 连接参数。

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请通过 GitHub Issues 联系。