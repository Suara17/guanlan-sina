# App 目录说明

本目录是后端应用程序的核心代码目录，包含所有业务逻辑、API 路由、数据模型、配置和工具函数。

## 目录结构

```
app/
├── api/                    # API 路由和端点
├── core/                   # 核心配置和工具
├── alembic/                # 数据库迁移文件
├── email-templates/        # 邮件模板
├── __init__.py
├── backend_pre_start.py    # 后端启动前脚本
├── crud.py                 # 数据库 CRUD 操作
├── initial_data.py         # 初始数据脚本
├── main.py                 # FastAPI 应用主入口
├── models.py               # 数据模型定义
├── tests_pre_start.py      # 测试启动前脚本
├── utils.py                # 工具函数
└── worker.py               # Celery 异步任务工作进程
```

## 核心模块说明

### main.py
FastAPI 应用的主入口文件，负责：
- 创建 FastAPI 应用实例
- 配置 CORS 中间件
- 集成 API 路由
- 配置 Sentry 错误监控

### models.py
定义所有数据模型，包括：
- **用户与认证**: User, UserCreate, UserUpdate 等
- **生产管理**: ProductionLine, Station, ProductionPlan, ProductionRecord
- **质量管理**: QualityMetric, DefectDetail
- **异常分析**: Anomaly, Diagnosis, Solution, WorkOrder, CaseLibrary
- **审计日志**: AuditLog
- **工具模型**: Message, Token, TokenPayload

### crud.py
数据库 CRUD 操作函数，提供：
- 用户创建、更新、查询、认证
- 物品（Item）创建
- 数据库会话管理

### core/config.py
应用配置管理，使用 Pydantic Settings：
- 数据库连接配置（PostgreSQL）
- Redis 配置
- SMTP 邮件配置
- JWT 认证配置
- CORS 配置
- 环境变量管理

### worker.py
Celery 异步任务工作进程，用于：
- 后台任务处理
- 异步作业执行

## API 路由

所有 API 路由定义在 `app/api/routes/` 目录下：
- `login.py` - 用户登录和认证
- `users.py` - 用户管理
- `items.py` - 物品管理
- `production.py` - 生产管理
- `anomalies.py` - 异常分析与管理
- `private.py` - 私有接口（仅本地环境）
- `utils.py` - 工具接口

## 数据库迁移

使用 Alembic 进行数据库版本管理：
- 迁移脚本位于 `app/alembic/versions/`
- 使用 `alembic upgrade head` 应用迁移
- 使用 `alembic revision --autogenerate -m "message"` 创建新迁移

## 邮件模板

邮件模板使用 MJML 格式：
- 源文件位于 `email-templates/src/`
- 编译后的 HTML 文件位于 `email-templates/build/`
- 支持的模板：新账户邮件、密码重置邮件、测试邮件

## 启动脚本

- `backend_pre_start.py` - 后端启动前的准备工作
- `tests_pre_start.py` - 测试环境启动前的准备工作
- `initial_data.py` - 初始化数据库数据
