# Core 目录说明

本目录包含应用的核心配置、数据库连接、安全认证和 Celery 任务队列配置。

## 目录结构

```
core/
├── __init__.py
├── celery_app.py    # Celery 应用配置
├── config.py        # 应用配置管理
├── db.py            # 数据库连接配置
└── security.py      # 安全认证工具
```

## 模块说明

### config.py
应用配置管理模块，使用 Pydantic Settings：

**配置项：**
- `API_V1_STR` - API 版本前缀（默认: `/api/v1`）
- `SECRET_KEY` - JWT 密钥（必须修改默认值）
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token 过期时间（默认: 8 天）
- `FRONTEND_HOST` - 前端主机地址
- `ENVIRONMENT` - 运行环境（`local`/`staging`/`production`）
- `BACKEND_CORS_ORIGINS` - CORS 允许的来源列表
- `PROJECT_NAME` - 项目名称
- `SENTRY_DSN` - Sentry 错误监控地址
- `REDIS_URL` - Redis 连接地址
- `POSTGRES_*` - PostgreSQL 数据库配置
- `SMTP_*` - SMTP 邮件服务配置
- `EMAILS_*` - 邮件发送配置
- `FIRST_SUPERUSER` - 首个超级管理员账号

**环境变量：**
配置从项目根目录的 `.env` 文件读取

### db.py
数据库连接配置模块：
- 创建 SQLAlchemy 数据库引擎
- 配置数据库会话工厂
- 提供数据库依赖注入

### security.py
安全认证工具模块：
- `get_password_hash` - 密码哈希（使用 bcrypt）
- `verify_password` - 密码验证
- `create_access_token` - 创建 JWT 访问令牌
- `verify_token` - 验证 JWT 令牌

### celery_app.py
Celery 应用配置模块：
- 创建 Celery 应用实例
- 配置 Redis 作为消息代理和结果后端
- 定义异步任务

## 安全注意事项

⚠️ **重要：** 部署前必须修改以下配置的默认值：
- `SECRET_KEY` - JWT 密钥
- `POSTGRES_PASSWORD` - 数据库密码
- `FIRST_SUPERUSER_PASSWORD` - 超级管理员密码

## 数据库连接

使用 PostgreSQL + psycopg2 驱动，连接字符串格式：
```
postgresql+psycopg2://user:password@host:port/database
```

## 消息队列

使用 Redis 作为 Celery 的消息代理和结果后端：
- 格式：`redis://localhost:6379/0`
- 支持异步任务执行和结果存储

## 邮件服务

支持 SMTP 邮件发送：
- 支持 TLS/SSL 加密
- 可配置发件人信息
- 用于用户注册、密码重置等场景
