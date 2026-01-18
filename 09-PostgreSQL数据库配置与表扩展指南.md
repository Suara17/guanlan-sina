# PostgreSQL数据库配置与表扩展指南

## 📦 PostgreSQL在Docker中的运行说明

### 1️⃣ 当前配置概览

项目使用 **PostgreSQL 17**，配置在 `docker-compose.yml` 中：

```yaml
db:
  image: postgres:17
  restart: always
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 10s
    retries: 5
    start_period: 30s
    timeout: 10s
  volumes:
    - app-db-data:/var/lib/postgresql/data/pgdata
  env_file:
    - .env
```

### 2️⃣ 启动数据库

**启动整个服务栈（包括数据库）：**
```bash
docker-compose up -d db
```

**启动所有服务：**
```bash
docker-compose up -d
```

### 3️⃣ 数据库连接配置

数据库连接信息通过 `.env` 文件配置：
- `POSTGRES_USER` - 数据库用户名
- `POSTGRES_PASSWORD` - 数据库密码
- `POSTGRES_DB` - 数据库名称
- `POSTGRES_SERVER` - 服务器地址（Docker内为 `db`）
- `POSTGRES_PORT` - 端口（默认5432）

### 4️⃣ 表扩展（使用Alembic迁移）

项目使用 **Alembic** 进行数据库迁移管理：

#### 查看当前迁移状态
```bash
# 进入backend容器
docker-compose exec backend bash

# 查看迁移历史
alembic history

# 查看当前版本
alembic current
```

#### 创建新的迁移（表扩展）

**步骤1：在 `backend/app/models.py` 中定义新模型**

```python
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import String
from datetime import datetime

class NewTable(SQLModel, table=True):
    __tablename__ = "new_table"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**步骤2：生成迁移文件**
```bash
# 在backend目录下运行
docker-compose exec backend alembic revision --autogenerate -m "描述你的变更"
```

这会在 `backend/app/alembic/versions/` 下生成新的迁移文件。

**步骤3：查看生成的迁移文件**
```bash
docker-compose exec backend cat app/alembic/versions/你的迁移文件.py
```

**步骤4：应用迁移**
```bash
docker-compose exec backend alembic upgrade head
```

#### 回滚迁移
```bash
# 回滚一个版本
docker-compose exec backend alembic downgrade -1

# 回滚到指定版本
docker-compose exec backend alembic downgrade <revision_id>
```

### 5️⃣ 直接操作数据库（可选）

**进入PostgreSQL容器：**
```bash
docker-compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

**常用SQL命令：**
```sql
-- 查看所有表
\dt

-- 查看表结构
\d 表名

-- 查看所有数据库
\l

-- 退出
\q
```

### 6️⃣ 使用Adminer管理数据库

项目已配置 **Adminer**（数据库管理界面）：
- 访问地址：`http://adminer.${DOMAIN}` 或 `http://localhost:8080`（本地开发）
- 系统：PostgreSQL
- 服务器：`db`（Docker网络内）或 `localhost`
- 用户名：`${POSTGRES_USER}`
- 密码：`${POSTGRES_PASSWORD}`
- 数据库：`${POSTGRES_DB}`

### 7️⃣ 数据持久化

数据库数据存储在Docker卷 `app-db-data` 中，即使容器删除，数据也会保留。

**查看卷：**
```bash
docker volume ls | grep app-db-data
```

### 8️⃣ 常用维护命令

```bash
# 查看数据库日志
docker-compose logs -f db

# 重启数据库
docker-compose restart db

# 停止数据库
docker-compose stop db

# 删除数据库容器（保留数据）
docker-compose rm -f db

# 删除数据库和数据卷（⚠️ 会丢失所有数据）
docker-compose down -v
```

### 9️⃣ 完整的表扩展示例流程

假设你要添加一个 `projects` 表：

```bash
# 1. 修改 models.py 添加模型
# 2. 生成迁移
docker-compose exec backend alembic revision --autogenerate -m "add_projects_table"

# 3. 检查迁移文件
docker-compose exec backend cat app/alembic/versions/最新迁移.py

# 4. 应用迁移
docker-compose exec backend alembic upgrade head

# 5. 验证表已创建
docker-compose exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "\dt"
```

### 🔍 当前已有的迁移

项目已有以下迁移：
- `e2412789c190` - 初始化模型
- `d98dd8ec85a3` - 替换ID整数类型
- `16e1257ee861` - 添加生产模型
- `1a31ce608336` - 添加级联删除关系
- `7904fb24eeba` - 添加司南模型
- `9c0a54914c78` - 添加字符串最大长度

## 📝 Alembic迁移最佳实践

1. **总是先查看生成的迁移文件**，确保变更符合预期
2. **使用有意义的迁移描述**，便于后续追踪
3. **在开发环境先测试迁移**，确认无误后再应用到生产环境
4. **不要手动修改已应用的迁移文件**，如果需要修复，创建新的迁移
5. **保持迁移顺序**，不要跳过中间版本

## ⚠️ 注意事项

- 迁移操作会修改数据库结构，执行前请确保已备份重要数据
- 在生产环境执行迁移前，建议在测试环境先验证
- 如果迁移失败，不要直接删除迁移文件，应先分析错误原因并修复
