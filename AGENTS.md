# AGENTS.md - 天工·弈控项目开发指南

本文档为智能编码代理提供项目开发规范和操作指南，帮助代理快速理解项目结构、编码标准和开发工作流。

## 项目概览

**天工·弈控** 是一个面向离散制造业的"视-空协同"智适应操作系统，采用 1+N+X 架构：
- **1 (OS内核)**: 基础设施层 - 设备连接、数据采集、基础诊断
- **N (原子能力)**: 服务组件层 - 视觉算法、知识图谱、优化引擎等模块化能力
- **X (场景APP)**: 应用编排层 - 行业解决方案和低代码编排

**技术栈：**
- **后端**: Python 3.10+ (FastAPI, SQLModel, PostgreSQL, Redis, Celery), uv (依赖管理)
- **前端**: React 19 (Vite 6, TypeScript 5.8, Tailwind CSS, Biome, Recharts)
- **数据库**: PostgreSQL (主数据库), Neo4j (知识图谱)
- **AI/LLM**: Google GenAI (Gemini) 集成

### 后端开发命令
```bash
# 启动后端和数据库(Docker)
docker compose up -d db backend

# 启动完整的开发环境(包括Neo4j知识图谱)
docker compose up -d

# 查看后端日志
docker compose logs backend
```

### 单独管理服务

```bash
# 启动特定服务
docker compose up -d db

# 停止特定服务
docker compose stop backend

# 启动Neo4j知识图谱服务
docker compose up -d neo4j
```

### Adminer 数据库管理

Adminer 是一个轻量级的数据库管理工具，可以方便地管理 PostgreSQL 数据库。

```bash
# 使用 Docker Compose 启动 Adminer 服务（端口 8080）
docker compose up -d adminer
```

### 前端开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (localhost:3000)
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 从 OpenAPI 规范生成类型化客户端
npm run generate-client

# 代码检查和格式化 (Biome)
npm run lint
```

### 数据库迁移

```bash
cd backend
uv run alembic revision --autogenerate -m "描述"  # 创建迁移
uv run alembic upgrade head                       # 应用迁移
uv run alembic downgrade -1                       # 回滚一步
```

## 代码风格指南

### 后端 Python 规范

#### 命名约定
- **变量和函数**: `snake_case` (例如: `user_data`, `get_user_by_id`)
- **类名**: `PascalCase` (例如: `UserService`, `DatabaseConnection`)
- **常量**: `UPPER_SNAKE_CASE` (例如: `MAX_RETRY_COUNT`)
- **私有成员**: 前缀单下划线 (例如: `_internal_method`)

#### 类型注解
```python
# 强制要求类型注解
def get_user(user_id: int) -> User | None:
    # 函数参数和返回值必须有类型注解

# 复杂类型使用 typing 模块
from typing import List, Optional, Dict
def process_users(users: List[Dict[str, Any]]) -> Optional[User]:
```

#### 导入组织 (Ruff isort)
```python
# 标准库导入
import os
import sys
from typing import List, Optional

# 第三方库导入
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

# 本地模块导入 (使用相对导入)
from app.core.config import settings
from app.models import User
```

#### 错误处理
```python
# 使用具体的异常类型，避免裸 except
try:
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

#### SQLModel 模型定义
```python
from sqlmodel import SQLModel, Field
from typing import Optional

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 前端 TypeScript/React 规范

#### 命名约定
- **组件**: `PascalCase` (例如: `UserProfile`, `Dashboard`)
- **变量/函数**: `camelCase` (例如: `userData`, `handleSubmit`)
- **常量**: `UPPER_SNAKE_CASE` (例如: `API_BASE_URL`)
- **文件**: `PascalCase.tsx` (例如: `UserProfile.tsx`)

#### React 组件结构
```tsx
import type React from 'react'
import { useState, useEffect } from 'react'

interface UserProfileProps {
  userId: string
  onUpdate?: (user: User) => void
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    setLoading(true)
    try {
      const response = await api.getUser(userId)
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-profile">
      {/* JSX 内容 */}
    </div>
  )
}

export default UserProfile
```

#### TypeScript 类型定义
```typescript
// 接口定义
interface User {
  id: string
  email: string
  username: string
  isActive: boolean
  createdAt: Date
}

// API 响应类型
interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// 联合类型和枚举
type UserRole = 'admin' | 'user' | 'moderator'

enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}
```

#### Tailwind CSS 样式
```tsx
// 使用 Tailwind 工具类，优先原子化样式
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">标题</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
    按钮
  </button>
</div>
```

#### 导入组织
```typescript
// React 相关导入
import React, { useState, useEffect } from 'react'

// 第三方库
import { useNavigate } from 'react-router-dom'
import { User, Settings } from 'lucide-react'

// 本地组件和工具
import { Button } from './components/Button'
import { api } from '../services/api'
import type { User } from '../types'
```

### 通用代码质量要求

#### 错误处理
- 后端: 使用具体的异常类型，提供有意义的错误信息
- 前端: 使用 try-catch 包装异步操作，提供用户友好的错误提示

#### 日志记录
```python
# 后端使用标准 logging 模块
import logging
logger = logging.getLogger(__name__)
logger.info("User %s logged in", user_id)
logger.error("Failed to process request: %s", error)
```

#### 注释规范
```typescript
// 简短注释使用 //，复杂逻辑添加 JSDoc
/**
 * 计算用户活跃度评分
 * @param userId 用户ID
 * @param actions 用户操作记录
 * @returns 活跃度评分 (0-100)
 */
function calculateActivityScore(userId: string, actions: Action[]): number {
  // 实现逻辑
}
```

#### 性能优化
- 避免不必要的重新渲染 (使用 React.memo, useMemo, useCallback)
- 后端 API 响应添加适当缓存
- 数据库查询优化，避免 N+1 查询问题

### 测试规范

#### 后端测试 (pytest)
```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

def test_create_user(client: TestClient, db: Session):
    """测试用户创建功能"""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123"
    }

    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
```

#### 测试命名
- 测试文件: `test_*.py` (例如: `test_users.py`)
- 测试函数: `test_*` (例如: `test_create_user`, `test_get_user_by_id`)

#### 测试覆盖率目标
- 后端: 目标覆盖率 > 80%
- 前端: 目前无测试框架，建议添加 Jest/Vitest

### 提交规范

#### Git 提交信息格式
```
type(scope): description

[optional body]

[optional footer]
```

#### 提交类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具配置

#### 示例
```
feat(auth): add JWT token refresh functionality

- Implement automatic token refresh on expiration
- Add refresh token storage in localStorage
- Update login flow to handle token refresh

Closes #123
```

### 项目结构回顾

#### 后端目录结构
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
│       └── knowledge_graph.py # 知识图谱路由
├── models.py               # SQLModel数据库模型
├── crud.py                 # CRUD操作
└── worker.py               # Celery后台任务
```

#### 前端目录结构
```
frontend/
├── src/
│   └── client/             # 自动生成的API客户端 (OpenAPI TS)
├── components/             # 通用组件
│   ├── AiAssistant.tsx     # AI助手组件
│   ├── AnomalyList.tsx     # 异常列表组件
│   ├── DataDashboard.tsx   # 数据仪表盘
│   ├── KnowledgeGraphCanvas.tsx # 知识图谱画布
│   ├── LandingPage.tsx     # 落地页
│   ├── LoadingSpinner.tsx  # 加载动画
│   ├── LoginPage.tsx       # 登录页组件
│   ├── NodeDetailPanel.tsx # 节点详情面板
│   ├── ProductionLineSelector.tsx # 产线选择器
│   ├── ProtectedRoute.tsx  # 路由保护
│   ├── Sidebar.tsx         # 侧边栏
│   ├── SinanAvatar.tsx     # 司南数字人
│   ├── TiangongLogo.tsx    # 天工Logo
│   └── TopBar.tsx          # 顶部导航
├── pages/                  # 页面视图
│   ├── Dashboard.tsx       # 总览看板
│   ├── Huntian.tsx         # 浑天(验证层)
│   ├── KernelConnect.tsx   # 内核连接
│   ├── KnowledgeGraph.tsx  # 知识图谱
│   ├── Marketplace.tsx     # 能力市场
│   ├── ScenarioBuilder.tsx # 场景编排
│   ├── SinanAnalysis.tsx   # 司南分析
│   └── Tianchou.tsx        # 天筹(决策层)
├── services/
│   └── geminiService.ts    # Google GenAI服务集成
├── contexts/
│   └── AuthContext.tsx     # 认证上下文(持久化登录)
├── hooks/
│   └── useAuth.tsx         # 认证Hook
├── App.tsx                 # 根组件
└── index.tsx               # 应用入口
```

### 开发工作流

1. **功能开发**:
   - 创建功能分支 `git checkout -b feature/new-feature`
   - 编写代码，确保通过类型检查和代码检查
   - 编写测试，确保覆盖率达标
   - 提交代码 `git commit -m "feat: add new feature"`

2. **代码审查**:
   - 推送分支到远程
   - 创建 Pull Request
   - 等待代码审查和 CI 检查

3. **部署**:
   - 合并到主分支后自动触发部署
   - 使用 Docker Compose 进行本地部署验证

### 常见陷阱避免

- 不要在前端进行复杂业务逻辑处理
- 后端 API 响应要包含错误状态和消息
- 数据库迁移要谨慎处理，避免数据丢失
- 前端组件要考虑加载状态和错误状态
- 环境变量不要硬编码在代码中
- 注意Neo4j知识图谱服务的配置和连接

---

*本文档版本: 1.1 | 更新日期: 2026-02-10 | 项目: 天工·弈控*</content>
<parameter name="filePath">AGENTS.md
