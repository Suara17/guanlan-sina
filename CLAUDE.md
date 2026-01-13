# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

---

## 项目概述

这是一个名为"观澜-司南"（guanlan-sina）的全栈Web应用，采用 FastAPI 后端和 React 前端架构。

- **后端**: FastAPI, SQLModel (ORM), PostgreSQL, Pydantic, Alembic
- **前端**: React 19, TypeScript, Vite, TanStack Query, TanStack Router, Tailwind CSS, shadcn/ui

### 核心子系统

**观澜（GuanLan）- 生产可视化门户**
- 面向对象：管理层、现场人员
- 核心价值：提供"生产节奏 + 质量指标"统一总览
- 解决痛点：消除"去现场看、去系统查"的信息割裂

**司南（SiNan）- 决策助手**
- 面向对象：工艺工程师、质量工程师、现场主管
- 核心价值：提供"提醒 → 诊断 → 处置 → 复盘"完整闭环
- 解决痛点：结构化、可解释、可落地的异常处理

---

## 开发环境与命令

### 启动开发环境（推荐顺序）
1. **启动数据库**: `docker compose up -d db`（仅启动 PostgreSQL 数据库）
2. **启动后端**: 进入 `backend` 目录，激活环境后运行 `fastapi dev app/main.py`
3. **启动前端**: 进入 `frontend` 目录，运行 `npm run dev`

### 后端（`/backend`）
- **包管理器**: `uv`（推荐）或 `pip`
- **虚拟环境路径**: `E:\aa-zr\Python311`
- **安装依赖**: `uv sync`
- **激活环境**: `E:\aa-zr\Python311\Scripts\activate`（Windows）
- **运行本地服务器**: `fastapi dev app/main.py`（运行在 localhost:8000）
- **运行测试**: `bash ./scripts/test.sh` 或 `pytest`
- **运行单个测试**: `pytest tests/api/routes/test_users.py::test_read_user_me`
- **代码检查/格式化**: `ruff check .` / `ruff format .`
- **数据库迁移**:
  - 创建迁移: `alembic revision --autogenerate -m "message"`
  - 应用迁移: `alembic upgrade head`

### 前端（`/frontend`）
- **包管理器**: `npm`
- **安装依赖**: `npm install`
- **运行本地服务器**: `npm run dev`（运行在 localhost:5173）
- **构建**: `npm run build`
- **代码检查**: `npm run lint`（使用 Biome）
- **生成API客户端**: `npm run generate-client`（需要后端运行）
- **E2E测试**: `npx playwright test`（需要完整服务运行）

### 数据库（Docker）
- **数据库类型**: PostgreSQL
- **启动数据库**: `docker compose up -d db`（仅启动数据库服务）
- **查看日志**: `docker compose logs db`
- **停止数据库**: `docker compose down`
- **连接配置**: 数据库默认运行在 localhost:5432，连接字符串在 `backend/app/core/config.py` 中配置

---

## 代码结构

### 后端
- `app/main.py`: FastAPI 应用入口点
- `app/api/`: API 路由处理器（端点）
- `app/core/`: 核心配置（设置、数据库连接、安全）
- `app/models.py`: SQLModel 数据库模型和 Pydantic 模式
- `app/crud.py`: CRUD 操作
- `app/alembic/`: 数据库迁移脚本
- `app/email-templates/`: 邮件模板（MJML/HTML）
- `tests/`: pytest 测试套件

### 前端
- `src/routes/`: 应用路由（TanStack Router）
- `src/components/`: React 组件（通用组件和功能特定组件）
- `src/client/`: 自动生成的 OpenAPI 客户端
- `src/hooks/`: 自定义 React Hooks
- `src/assets/`: 静态资源

---

## 常见工作流程

### 1. 添加数据库模型
- 确保数据库正在运行：`docker compose up -d db`
- 在 `backend/app/models.py` 中添加模型类
- 创建迁移: `alembic revision --autogenerate -m "Add X model"`
- 应用迁移: `alembic upgrade head`

### 2. 添加 API 端点
- 如需要，在 `models.py` 中定义模式
- 在 `backend/app/api/routes/` 中创建路由处理器
- 如果创建新文件，在 `backend/app/api/main.py` 中注册路由

### 3. 更新前端客户端
- 确保后端正在运行（`fastapi dev app/main.py`）
- 在 `frontend/` 目录中运行 `npm run generate-client`

### 4. 安全检查
- 提交时自动运行 pre-commit hooks
- 手动运行: `uv run pre-commit run --all-files`

---

## 当前开发进度

### ✅ 已完成

#### 后端服务
- [x] FastAPI 框架搭建
- [x] PostgreSQL 数据库配置
- [x] SQLModel 数据模型定义
- [x] 数据库迁移系统（Alembic）
- [x] JWT 认证系统
- [x] 用户管理模块（CRUD）
- [x] 生产数据模型（ProductionLine, Station, ProductionPlan, ProductionRecord）
- [x] 质量指标模型（QualityMetric, DefectDetail）
- [x] 司南系统模型（Anomaly, Diagnosis, Solution, WorkOrder, CaseLibrary）
- [x] 审计日志系统（AuditLog）
- [x] Celery 任务队列配置
- [x] Redis 缓存配置
- [x] API 文档自动生成（Swagger UI, ReDoc）

#### 数据库迁移
- [x] 初始数据库模型同步（v1）
- [x] 添加诊断表和更新解决方案表（v2）
- [x] 修复产线与工位之间的关系映射（v3）

#### 前端应用
- [x] React 19 + TypeScript + Vite 搭建
- [x] TanStack Router 路由配置
- [x] TanStack Query 状态管理
- [x] shadcn/ui 组件库集成
- [x] Tailwind CSS 样式系统
- [x] 用户认证界面（登录、注册）
- [x] Dashboard 仪表盘组件
- [x] 生产图表组件（Recharts）
- [x] 用户管理界面
- [x] OpenAPI 客户端自动生成

#### 测试
- [x] 后端 pytest 测试框架
- [x] 前端 Playwright E2E 测试框架
- [x] 认证流程测试
- [x] 用户管理测试

#### 开发工具
- [x] 代码格式化（Ruff, Biome）
- [x] Pre-commit hooks
- [x] GitHub Actions CI/CD

### 🚧 进行中

#### 观澜系统（生产可视化）
- [ ] 实时数据看板
- [ ] 生产进度监控
- [ ] 质量指标可视化
- [ ] 瓶颈工位分析
- [ ] WIP 深度分析
- [ ] 历史趋势对比
- [ ] 大屏展示模式

#### 司南系统（决策助手）
- [ ] 异常检测与提醒
- [ ] 知识图谱可视化
- [ ] 诊断分析引擎
- [ ] 处置方案推荐
- [ ] ROI 预演工具
- [ ] 工单生成与推送
- [ ] 案例库管理
- [ ] 复盘分析工具

#### 后端功能
- [ ] WebSocket 实时通信
- [ ] 消息队列事件驱动
- [ ] 与底层模块集成（洞微、格物、天筹、浑天）
- [ ] MES 系统对接
- [ ] PLC 指令下发
- [ ] PDF 报表生成

#### 前端功能
- [ ] 观澜总览页面
- [ ] 司南诊断页面
- [ ] 方案对比页面
- [ ] 工单执行页面
- [ ] 案例库查询页面
- [ ] 移动端适配
- [ ] 深色主题切换
- [ ] 国际化支持

### 📋 待规划

- [ ] 性能优化（缓存、索引、CDN）
- [ ] 安全加固（HTTPS、数据加密、审计）
- [ ] 监控告警系统（Sentry、Prometheus）
- [ ] 单点登录（企业微信、钉钉）
- [ ] 多租户支持
- [ ] 数据导出功能
- [ ] 打印功能（工单、报表）

---

## 数据模型关系图

```
User (用户)
  ├─ Item (项目) [1:N]
  ├─ factory_ids (工厂权限)
  └─ line_ids (产线权限)

ProductionLine (生产线)
  ├─ Station (工位) [1:N]
  ├─ ProductionPlan (生产计划) [1:N]
  └─ bottleneck_station_id (瓶颈工位) [N:1]

Station (工位)
  ├─ ProductionRecord (生产记录) [1:N]
  └─ line_id (所属产线) [N:1]

ProductionPlan (生产计划)
  └─ ProductionRecord (生产记录) [1:N]

ProductionRecord (生产记录)
  ├─ QualityMetric (质量指标) [1:1]
  └─ DefectDetail (缺陷详情) [1:N]

Anomaly (异常)
  ├─ Diagnosis (诊断) [1:N]
  ├─ Solution (解决方案) [1:N]
  └─ WorkOrder (工单) [1:N]

Diagnosis (诊断)
  ├─ Solution (解决方案) [1:N]
  └─ CaseLibrary (案例库) [1:N]

Solution (解决方案)
  ├─ WorkOrder (工单) [1:N]
  └─ CaseLibrary (案例库) [1:N]

WorkOrder (工单)
  └─ CaseLibrary (案例库) [1:1]

AuditLog (审计日志)
  └─ user_id (操作用户) [N:1]
```

---

## 技术文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 项目概述 | `01-项目概述与需求分析.md` | 详细需求分析和系统设计 |
| 观澜设计 | `02-观澜系统功能设计.md` | 观澜系统功能设计 |
| 司南设计 | `03-司南系统功能设计.md` | 司南系统功能设计 |
| 技术架构 | `04-技术架构设计.md` | 技术架构设计 |
| 数据存储 | `05-数据存储设计.md` | 数据存储设计 |
| 开发计划 | `06-开发计划与测试策略.md` | 开发计划与测试策略 |
| 运维监控 | `07-运维监控与安全加固.md` | 运维监控与安全加固 |
| 启动指南 | `启动指南.md` | 项目启动指引 |
| 代码结构 | `项目代码结构说明.md` | 代码结构说明 |
| 后端修复 | `后端服务验证与修复总结.md` | 后端服务修复总结 |

---

## 已知问题与解决方案

### 问题1: 数据库驱动不匹配
- **问题**: 运行 Alembic 迁移时出现 `ModuleNotFoundError: No module named 'psycopg'`
- **原因**: 项目配置使用 `postgresql+psycopg`，但系统只安装了 `psycopg2-binary`
- **解决**: 修改 `app/core/config.py` 中的数据库 URL 方案为 `postgresql+psycopg2`

### 问题2: 循环外键关系映射错误
- **问题**: 访问 API 端点时出现 `sqlalchemy.exc.AmbiguousForeignKeysError`
- **原因**: `ProductionLine` 和 `Station` 之间存在多个外键关系
- **解决**: 使用 `sa_relationship_args` 参数明确指定外键关系

### 问题3: 缺失模型定义
- **问题**: 后端服务启动时抛出 `ImportError: cannot import name 'Diagnosis'`
- **原因**: 路由文件引用了 `Diagnosis` 模型，但模型未定义
- **解决**: 在 `app/models.py` 中添加完整的模型定义并创建迁移

---

## 开发注意事项

### 数据库迁移
- 每次修改模型后必须创建新的迁移
- 迁移文件命名要清晰描述变更内容
- 应用迁移前先在测试环境验证

### API 设计
- 遵循 RESTful 设计原则
- 使用 Pydantic 模式进行数据验证
- 为所有端点添加文档字符串
- 使用适当的 HTTP 状态码

### 前端开发
- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 组件要保持单一职责
- 使用 TanStack Query 进行数据获取

### 代码质量
- 提交前运行 `pre-commit` hooks
- 编写单元测试和集成测试
- 保持代码风格一致性
- 添加必要的注释说明复杂逻辑

---

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目仓库: https://github.com/Suara17/guanlan-sina.git
- 问题反馈: 使用 GitHub Issues
- 文档更新: 请参考技术文档索引

---

**最后更新**: 2026年1月13日
