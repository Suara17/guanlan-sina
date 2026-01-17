# 数据库管理指南

## 概述

天工·弈控系统使用 PostgreSQL 作为主要数据库，采用 Docker Compose 进行容器化部署。数据库包含完整的生产制造管理系统，支持用户认证、生产管理、质量控制、异常分析等核心功能。

## 1. 服务启动指南

### Docker Compose 启动

#### 启动数据库服务
```bash
# 仅启动数据库
docker compose up db -d

# 启动数据库和Adminer
docker compose up db adminer -d

# 启动完整开发环境（推荐）
docker compose watch
```

#### 检查服务状态
```bash
# 查看服务运行状态
docker compose ps

# 查看数据库健康检查
docker compose logs db

# 查看Adminer日志
docker compose logs adminer
```

### 环境变量配置

数据库连接配置位于 `.env` 文件中：

```bash
# Postgres 数据库配置
POSTGRES_SERVER=localhost          # Docker环境内使用 db
POSTGRES_PORT=5432
POSTGRES_DB=app                    # 数据库名称
POSTGRES_USER=postgres             # 默认超级用户
POSTGRES_PASSWORD=123456           # 数据库密码

# 应用配置
FIRST_SUPERUSER=admin@example.com      # 默认管理员邮箱
FIRST_SUPERUSER_PASSWORD=12345678      # 默认管理员密码
```

## 2. 连接配置

### Docker环境连接参数
- **主机**: `db` (Docker内部) 或 `localhost` (外部连接)
- **端口**: `5432`
- **数据库**: `app`
- **用户**: `postgres`
- **密码**: `123456`

### 开发环境连接字符串
```bash
# Docker外部连接
postgresql://postgres:123456@localhost:5432/app

# Docker内部连接（后端使用）
postgresql://postgres:123456@db:5432/app
```

## 3. Web界面管理 (Adminer)

### 访问Adminer
- **URL**: `http://adminer.localhost.tiangolo.com` (生产环境)
- **本地开发**: `http://localhost:8080`
- **用户名**: `postgres`
- **密码**: `123456`
- **数据库**: `app`

### Adminer使用指南

#### 1. 登录数据库
1. 打开Adminer界面
2. 选择 "PostgreSQL" 作为系统
3. 输入服务器 `db`（Docker环境）或 `localhost`（本地）
4. 输入用户名 `postgres` 和密码 `123456`
5. 选择数据库 `app`

#### 2. 浏览数据表
- 点击左侧的表名查看数据
- 使用 "Select data" 查看记录
- 使用 "Edit" 修改数据
- 使用 "Execute SQL command" 运行自定义查询

#### 3. 执行SQL查询
```sql
-- 查看所有用户
SELECT * FROM users;

-- 查看生产记录
SELECT * FROM production_records LIMIT 10;

-- 查看异常统计
SELECT defect_type, COUNT(*) as count
FROM anomalies
GROUP BY defect_type
ORDER BY count DESC;
```

## 4. 命令行管理 (psql)

### 连接到数据库

#### Docker容器内连接
```bash
# 进入数据库容器
docker compose exec db psql -U postgres -d app

# 或直接执行命令
docker compose exec db psql -U postgres -d app -c "SELECT version();"
```

#### 本地连接（如果安装了psql）
```bash
# 连接到本地数据库
psql -h localhost -p 5432 -U postgres -d app

# 使用环境变量
PGPASSWORD=123456 psql -h localhost -p 5432 -U postgres -d app
```

### 常用psql命令

#### 数据库信息查询
```sql
-- 查看数据库版本
SELECT version();

-- 查看所有数据库
\l

-- 查看当前数据库中的所有表
\dt

-- 查看表结构
\d users
\d production_lines

-- 查看表中的数据（前10行）
SELECT * FROM users LIMIT 10;
SELECT * FROM production_records LIMIT 10;
```

#### 数据查询命令
```sql
-- 统计各类型异常数量
SELECT defect_type, COUNT(*) as count
FROM anomalies
GROUP BY defect_type
ORDER BY count DESC;

-- 查看最近的生产记录
SELECT pr.*, pl.line_name, s.station_name
FROM production_records pr
JOIN production_lines pl ON pr.line_id = pl.id
JOIN stations s ON pr.station_id = s.id
ORDER BY pr.recorded_at DESC
LIMIT 20;

-- 查看质量指标统计
SELECT
    DATE(calculated_at) as date,
    AVG(yield_rate) as avg_yield,
    AVG(defect_rate) as avg_defect
FROM quality_metrics
GROUP BY DATE(calculated_at)
ORDER BY date DESC
LIMIT 7;
```

#### 用户管理命令
```sql
-- 查看所有用户
SELECT id, username, email, is_active, is_superuser, created_at
FROM users
ORDER BY created_at DESC;

-- 创建新用户（通过API更安全）
-- 注意：密码应该通过API创建，因为需要哈希处理

-- 查看用户权限
SELECT username, permissions, factory_ids, line_ids
FROM users
WHERE username = 'admin';
```

## 5. 用户管理

### 默认用户
系统会在首次启动时自动创建以下默认用户：

- **超级管理员**
  - 邮箱: `admin@example.com`
  - 用户名: `admin`
  - 密码: `12345678`
  - 权限: 完全访问权限

### 添加新用户

#### 方法1: 通过Adminer界面
1. 打开Adminer，连接到数据库
2. 选择 `users` 表
3. 点击 "New item" 添加新用户
4. 填写必要字段：
   - `email`: 用户邮箱
   - `username`: 用户名
   - `hashed_password`: **注意：必须使用bcrypt哈希后的密码**
   - `is_active`: true
   - `is_superuser`: false（除非是管理员）

#### 方法2: 通过API（推荐）
```bash
# 使用API创建用户（会自动处理密码哈希）
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "securepassword123",
    "is_active": true,
    "is_superuser": false
  }'
```

#### 方法3: 通过后端管理界面
访问应用的管理界面创建用户。

### 用户权限管理
用户权限通过以下字段控制：
- `permissions`: 权限列表（数组）
- `factory_ids`: 可访问的工厂ID列表
- `line_ids`: 可访问的生产线ID列表
- `is_superuser`: 是否为超级用户

## 6. 数据库结构

### 核心数据表

#### 用户与认证 (Users & Auth)
- **`users`**: 用户主表
  - `id` (UUID): 主键
  - `email` (String): 邮箱地址，唯一
  - `username` (String): 用户名，唯一
  - `hashed_password` (String): bcrypt哈希密码
  - `is_active` (Boolean): 是否激活
  - `is_superuser` (Boolean): 是否超级用户
  - `full_name` (String): 全名
  - `phone` (String): 电话
  - `role` (String): 角色
  - `factory_ids` (Array): 可访问工厂ID
  - `line_ids` (Array): 可访问生产线ID
  - `permissions` (Array): 权限列表
  - `created_at` (DateTime): 创建时间
  - `last_login_at` (DateTime): 最后登录时间

#### 生产管理 (Production Management)
- **`production_lines`**: 生产线表
  - `id` (UUID): 主键
  - `line_name` (String): 生产线名称
  - `factory_id` (UUID): 工厂ID
  - `status` (String): 状态 (active/inactive)
  - `current_status` (String): 当前状态 (idle/running/stopped)
  - `current_plan_id` (UUID): 当前计划ID
  - `bottleneck_station_id` (UUID): 瓶颈工位ID

- **`stations`**: 工位表
  - `id` (UUID): 主键
  - `station_name` (String): 工位名称
  - `line_id` (UUID): 所属生产线ID
  - `station_type` (String): 工位类型
  - `sequence_order` (Integer): 顺序号
  - `current_cycle_time` (Float): 当前周期时间
  - `wip_quantity` (Integer): 工位在制品数量
  - `equipment_ids` (Array): 设备ID列表

- **`production_plans`**: 生产计划表
  - `id` (UUID): 主键
  - `line_id` (UUID): 生产线ID
  - `product_name` (String): 产品名称
  - `planned_quantity` (Integer): 计划产量
  - `actual_quantity` (Integer): 实际产量
  - `start_time` (DateTime): 开始时间
  - `estimated_completion_time` (DateTime): 预计完成时间
  - `actual_completion_time` (DateTime): 实际完成时间
  - `status` (String): 状态 (planned/active/completed/cancelled)

- **`production_records`**: 生产记录表
  - `id` (UUID): 主键
  - `plan_id` (UUID): 计划ID
  - `line_id` (UUID): 生产线ID
  - `station_id` (UUID): 工位ID
  - `product_id` (UUID): 产品ID
  - `batch_id` (String): 批次ID
  - `quantity` (Integer): 数量
  - `quality_status` (String): 质量状态
  - `defect_type` (String): 缺陷类型
  - `cycle_time` (Float): 周期时间
  - `recorded_at` (DateTime): 记录时间

#### 质量管理 (Quality Management)
- **`quality_metrics`**: 质量指标表
  - `id` (UUID): 主键
  - `plan_id` (UUID): 计划ID
  - `line_id` (UUID): 生产线ID
  - `station_id` (UUID): 工位ID
  - `total_produced` (Integer): 总产量
  - `good_quantity` (Integer): 良品数量
  - `defect_quantity` (Integer): 缺陷数量
  - `rework_quantity` (Integer): 返工数量
  - `yield_rate` (Float): 良率
  - `defect_rate` (Float): 缺陷率
  - `calculated_at` (DateTime): 计算时间

- **`defect_details`**: 缺陷详情表
  - `id` (UUID): 主键
  - `record_id` (UUID): 生产记录ID
  - `plan_id` (UUID): 计划ID
  - `line_id` (UUID): 生产线ID
  - `station_id` (UUID): 工位ID
  - `defect_type` (String): 缺陷类型
  - `severity` (String): 严重程度
  - `defect_image_url` (String): 缺陷图片URL
  - `confidence` (Float): 置信度
  - `detected_at` (DateTime): 检测时间

#### 异常分析 (Anomaly Analysis)
- **`anomalies`**: 异常表
  - `id` (UUID): 主键
  - `line_id` (UUID): 生产线ID
  - `station_id` (UUID): 工位ID
  - `defect_type` (String): 缺陷类型
  - `severity` (String): 严重程度
  - `detected_at` (DateTime): 检测时间
  - `status` (String): 状态 (open/in_progress/resolved/closed)
  - `assigned_to` (UUID): 分配给用户ID
  - `root_cause` (String): 根本原因
  - `solution_id` (UUID): 解决方案ID
  - `created_at` (DateTime): 创建时间
  - `closed_at` (DateTime): 关闭时间

- **`diagnoses`**: 诊断表
  - `id` (UUID): 主键
  - `anomaly_id` (UUID): 异常ID
  - `root_cause` (String): 根本原因
  - `confidence` (Float): 置信度
  - `created_at` (DateTime): 创建时间

- **`solutions`**: 解决方案表
  - `id` (UUID): 主键
  - `anomaly_id` (UUID): 异常ID
  - `solution_type` (String): 解决方案类型
  - `solution_name` (String): 解决方案名称
  - `description` (String): 描述
  - `estimated_downtime_hours` (Float): 预计停机时间
  - `success_rate` (Float): 成功率
  - `expected_loss` (Float): 预期损失
  - `roi` (Float): 投资回报率
  - `recommended` (Boolean): 是否推荐
  - `diagnosis_id` (UUID): 诊断ID
  - `simulation_result` (JSON): 仿真结果

- **`work_orders`**: 工单表
  - `id` (UUID): 主键
  - `solution_id` (UUID): 解决方案ID
  - `order_type` (String): 工单类型
  - `responsible_person` (String): 负责人
  - `instructions` (String): 执行说明
  - `estimated_duration_hours` (Float): 预计持续时间
  - `actual_duration_hours` (Float): 实际持续时间
  - `status` (String): 状态 (pending/in_progress/completed/cancelled)
  - `execution_result` (String): 执行结果
  - `actual_loss` (Float): 实际损失
  - `notes` (String): 备注
  - `created_at` (DateTime): 创建时间
  - `started_at` (DateTime): 开始时间
  - `completed_at` (DateTime): 完成时间

#### 案例库 (Case Library)
- **`case_library`**: 案例库表
  - `id` (UUID): 主键
  - `anomaly_id` (UUID): 异常ID
  - `problem_description` (String): 问题描述
  - `solution_adopted` (UUID): 采用的解决方案ID
  - `lessons_learned` (String): 经验教训
  - `diagnosis_result` (JSON): 诊断结果
  - `expected_effect` (JSON): 预期效果
  - `actual_effect` (JSON): 实际效果
  - `tags` (Array): 标签列表
  - `created_at` (DateTime): 创建时间

#### 审计日志 (Audit Logs)
- **`audit_logs`**: 审计日志表
  - `id` (UUID): 主键
  - `user_id` (UUID): 用户ID
  - `action` (String): 操作
  - `resource_type` (String): 资源类型
  - `resource_id` (String): 资源ID
  - `ip_address` (String): IP地址
  - `user_agent` (String): 用户代理
  - `response_status` (Integer): 响应状态码
  - `request_body` (JSON): 请求体
  - `created_at` (DateTime): 创建时间

#### 工具表 (Utility Tables)
- **`items`**: 物品表（模板/示例）
  - `id` (UUID): 主键
  - `title` (String): 标题
  - `description` (String): 描述
  - `owner_id` (UUID): 所有者ID

## 7. 备份恢复

### 数据备份

#### 方法1: Docker容器内备份
```bash
# 创建数据库备份
docker compose exec db pg_dump -U postgres -d app > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份到压缩文件
docker compose exec db pg_dump -U postgres -d app | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### 方法2: 本地备份（需要安装pg_dump）
```bash
# 直接备份到本地
PGPASSWORD=123456 pg_dump -h localhost -p 5432 -U postgres -d app > backup.sql

# 备份到压缩文件
PGPASSWORD=123456 pg_dump -h localhost -p 5432 -U postgres -d app | gzip > backup.sql.gz
```

#### 方法3: Adminer导出
1. 登录Adminer
2. 选择数据库 `app`
3. 点击 "Export"
4. 选择导出选项（结构+数据）
5. 下载SQL文件

### 数据恢复

#### 方法1: 从SQL文件恢复
```bash
# 停止应用服务
docker compose down

# 恢复数据库
docker compose exec -T db psql -U postgres -d app < backup.sql

# 或者从压缩文件恢复
gunzip -c backup.sql.gz | docker compose exec -T db psql -U postgres -d app

# 重启服务
docker compose up -d
```

#### 方法2: Adminer导入
1. 登录Adminer
2. 选择数据库 `app`
3. 点击 "Import"
4. 选择SQL备份文件
5. 执行导入

### 定期备份脚本

创建备份脚本 `backup.sh`：
```bash
#!/bin/bash

# 备份脚本
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_FILE"
docker compose exec db pg_dump -U postgres -d app | gzip > $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"

# 保留最近7天的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
echo "Old backups cleaned up"
```

添加定时任务：
```bash
# 每天凌晨2点执行备份
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

## 8. 故障排除

### 常见问题

#### 1. 数据库连接失败
**症状**: 应用无法启动，后端日志显示连接错误

**检查步骤**:
```bash
# 检查数据库容器状态
docker compose ps db

# 查看数据库日志
docker compose logs db

# 测试数据库连接
docker compose exec db pg_isready -U postgres -d app
```

**解决方案**:
```bash
# 重启数据库服务
docker compose restart db

# 如果问题持续，重新创建数据库
docker compose down
docker volume rm tian-gong-visual_app-db-data
docker compose up db -d
```

#### 2. Adminer无法访问
**症状**: Adminer界面无法打开

**检查步骤**:
```bash
# 检查Adminer容器状态
docker compose ps adminer

# 查看Adminer日志
docker compose logs adminer

# 检查端口占用
netstat -tlnp | grep 8080
```

**解决方案**:
```bash
# 重启Adminer服务
docker compose restart adminer

# 检查域名配置（生产环境）
# 确保Traefik配置正确
```

#### 3. 数据库迁移失败
**症状**: 后端启动时出现迁移错误

**检查步骤**:
```bash
# 查看迁移状态
docker compose exec backend alembic current

# 查看迁移历史
docker compose exec backend alembic history

# 检查最新迁移
docker compose exec backend alembic show head
```

**解决方案**:
```bash
# 应用所有待处理的迁移
docker compose exec backend alembic upgrade head

# 如果迁移冲突，手动解决后重新应用
docker compose exec backend alembic revision --autogenerate -m "fix migration"
```

#### 4. 数据丢失或损坏
**症状**: 应用数据显示异常或丢失

**检查步骤**:
```bash
# 检查数据库磁盘使用情况
docker compose exec db df -h

# 检查PostgreSQL日志
docker compose exec db tail -f /var/lib/postgresql/data/log/postgresql-*.log

# 验证数据完整性
docker compose exec db psql -U postgres -d app -c "SELECT COUNT(*) FROM users;"
```

**解决方案**:
```bash
# 从备份恢复数据
gunzip -c latest_backup.sql.gz | docker compose exec -T db psql -U postgres -d app

# 如果是数据损坏，考虑重建数据库
```

#### 5. 性能问题
**症状**: 查询缓慢，应用响应慢

**诊断命令**:
```sql
-- 查看活跃查询
SELECT pid, age(clock_timestamp(), query_start), usename, query
FROM pg_stat_activity
WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start desc;

-- 查看表大小
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**优化建议**:
```sql
-- 创建索引（如果需要）
CREATE INDEX CONCURRENTLY idx_production_records_recorded_at
ON production_records(recorded_at);

-- 分析表统计信息
ANALYZE production_records;

-- 清理死元组
VACUUM ANALYZE production_records;
```

#### 6. 磁盘空间不足
**检查命令**:
```bash
# 查看磁盘使用情况
docker compose exec db df -h

# 查看PostgreSQL数据目录大小
docker compose exec db du -sh /var/lib/postgresql/data

# 查看各表大小
docker compose exec db psql -U postgres -d app -c "
SELECT schemaname, tablename,
pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

**清理方法**:
```bash
# 清理死元组
docker compose exec db psql -U postgres -d app -c "VACUUM FULL;"

# 重新索引
docker compose exec db psql -U postgres -d app -c "REINDEX DATABASE app;"

# 删除旧日志
docker compose exec db find /var/lib/postgresql/data/log -name "*.log" -mtime +7 -delete
```

## 9. 开发环境集成

### 后端API集成

数据库通过SQLAlchemy ORM与后端API集成：

#### 连接配置 (`backend/app/core/config.py`):
```python
DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
)
```

#### 模型定义 (`backend/app/models.py`):
- 使用SQLModel定义数据模型
- 自动生成数据库表结构
- 支持关系映射和约束

#### CRUD操作 (`backend/app/crud.py`):
```python
# 用户CRUD示例
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.exec(select(User).where(User.email == email)).first()

def create_user(db: Session, user_create: UserCreate) -> User:
    hashed_password = get_password_hash(user_create.password)
    db_user = User(**user_create.dict(), hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

### 迁移管理

#### 创建迁移:
```bash
# 进入后端容器
docker compose exec backend bash

# 创建自动迁移
alembic revision --autogenerate -m "添加新功能"

# 应用迁移
alembic upgrade head
```

#### 自定义迁移:
```python
# alembic/versions/xxx_add_new_field.py
def upgrade():
    op.add_column('users', sa.Column('new_field', sa.String(), nullable=True))

def downgrade():
    op.drop_column('users', 'new_field')
```

### 测试环境

#### 测试数据库设置:
```bash
# 测试使用独立的数据库
export POSTGRES_DB=app_test

# 运行测试
docker compose exec backend bash scripts/tests-start.sh
```

### 开发工作流程

1. **修改模型**: 在`models.py`中更新SQLModel定义
2. **创建迁移**: `alembic revision --autogenerate -m "描述"`
3. **应用迁移**: `alembic upgrade head`
4. **测试更改**: 运行相关API测试
5. **提交代码**: 包含迁移文件的完整提交

### 生产部署注意事项

1. **备份策略**: 定期备份生产数据库
2. **迁移顺序**: 部署前先在测试环境验证迁移
3. **回滚计划**: 为每个迁移准备回滚脚本
4. **监控**: 设置数据库性能监控
5. **安全**: 定期更新PostgreSQL版本，管理用户权限

---

**维护提示**: 定期检查数据库性能，及时清理过期数据，监控磁盘使用情况，确保系统稳定运行。
