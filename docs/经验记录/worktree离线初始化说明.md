# Worktree 离线初始化说明

这套流程用于在新建 `git worktree` 和分支后，尽量不联网地快速恢复本地测试环境。

## 目标

- 前端优先走本机 `npm` 缓存，而不是默认复制整个 `node_modules`
- 后端优先走本机 `uv` 缓存，而不是默认复制整个 `.venv`
- PostgreSQL 和 Neo4j 长期保留一套本地基础服务，不跟随 worktree 重建
- 新 worktree 通过一条脚本完成 `.env`、依赖、数据库迁移和基础初始化

## 新增文件

- 根目录环境模板: `/.env.localdev.example`
- 初始化脚本: `/scripts/bootstrap-worktree.ps1`
- Neo4j Excel 导入脚本: `/backend/app/scripts/import_neo4j_excel.py`

## 推荐目录约定

可选保留一份模板依赖目录，作为缓存不完整时的兜底：

```text
E:\Guanlan-Sina\.shared\backend-venv
E:\Guanlan-Sina\.shared\frontend-node_modules
```

平时优先使用缓存离线安装，只有在 `uv` 或 `npm` 离线命中失败时，再通过脚本参数切回模板复制。

## 推荐前置条件

第一次在主仓库把缓存喂满：

```powershell
Set-Location E:\Guanlan-Sina\backend
uv sync --frozen

Set-Location E:\Guanlan-Sina\frontend
npm ci
```

完成后，后续新 worktree 通常可以直接走：

- `uv sync --frozen --offline`
- `npm ci --prefer-offline --no-audit --fund false`

## 日常流程

1. 新建 worktree 和分支

```powershell
git worktree add .worktrees\feature-demo -b feature/demo
```

2. 进入新 worktree

```powershell
Set-Location E:\Guanlan-Sina\.worktrees\feature-demo
```

3. 执行初始化脚本

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-worktree.ps1
```

执行内容如下：

- 若根目录没有 `.env`，则由 `.env.localdev.example` 复制生成
- 后端执行 `uv sync --frozen --offline`
- 前端执行 `npm ci --prefer-offline --no-audit --fund false`
- 启动本地 PostgreSQL 和 Neo4j
- 等待端口就绪
- 执行 `alembic upgrade head`
- 执行 `python app/initial_data.py`
- 若存在 `docs\知识图谱\data2.xlsx`，则导入 Neo4j

## 常用参数

### 1. 强制刷新 `.env`

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-worktree.ps1 -RefreshEnv
```

### 2. 离线缓存不完整时，改用模板目录

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-worktree.ps1 -UseBackendTemplate -UseFrontendTemplate
```

### 3. 只做依赖准备，不启服务

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-worktree.ps1 -SkipServices -SkipMigrate -SkipNeo4jImport
```

### 4. 服务已经启动，只补迁移和初始化

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-worktree.ps1 -SkipInstall
```

### 5. 初始化完成后直接拉起前后端开发服务

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-worktree.ps1 -StartApps
```

## 单独导入 Neo4j Excel

默认导入文件为 `docs/知识图谱/data2.xlsx`。也可以手动指定：

```powershell
Set-Location E:\Guanlan-Sina\backend
.\.venv\Scripts\python.exe -m app.scripts.import_neo4j_excel --excel-path ..\docs\知识图谱\data2.xlsx
```

如果不想清空现有图谱数据：

```powershell
.\.venv\Scripts\python.exe -m app.scripts.import_neo4j_excel --excel-path ..\docs\知识图谱\data2.xlsx --no-clear
```

## 环境变量说明

`/.env.localdev.example` 这份模板面向“宿主机直跑后端 + Docker 常驻数据库”的本地开发模式，关键值如下：

```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
FRONTEND_HOST=http://localhost:3000
NEO4J_URI=bolt://localhost:7687
```

注意：仓库当前根目录 `.env` 默认曾使用过 `NEO4J_URI=bolt://neo4j:7687` 这种容器内地址，这不适合宿主机直跑后端。新模板已经改为本地地址。

## 推荐实践

- 主仓库长期保留并定期更新 `npm` 和 `uv` 缓存
- 共享服务长期运行：PostgreSQL、Neo4j
- worktree 只切代码，不切基础服务
- 依赖优先重建，模板目录只作为缓存不完整时的兜底
- 如果 `package-lock.json` 或 `backend/uv.lock` 发生明显变化，优先回主仓库联网更新一次缓存

## 当前限制

- 脚本默认只启动 PostgreSQL 和 Neo4j，不会启动 Redis
- 如果后端本次测试依赖 Redis 或 Celery，需要额外自行启动
- `git status` 在当前仓库可能受 Windows `safe.directory` 限制影响，这不影响脚本本身运行
