# API 目录说明

本目录包含所有 API 路由和端点定义，使用 FastAPI 框架构建。

## 目录结构

```
api/
├── routes/                 # API 路由模块
│   ├── anomalies.py        # 异常分析接口
│   ├── items.py            # 物品管理接口
│   ├── login.py            # 登录认证接口
│   ├── private.py          # 私有接口（仅本地）
│   ├── production.py       # 生产管理接口
│   ├── users.py            # 用户管理接口
│   └── utils.py            # 工具接口
├── deps.py                 # 依赖注入
├── main.py                 # API 路由聚合
└── __init__.py
```

## 路由模块说明

### main.py
API 路由聚合器，负责：
- 创建 APIRouter 实例
- 注册所有子路由
- 根据环境配置启用/禁用私有路由

### deps.py
依赖注入模块，提供：
- 数据库会话依赖
- 用户认证依赖
- 权限验证依赖

### routes/login.py
用户登录和认证接口：
- 用户登录
- Token 获取和刷新
- 密码重置

### routes/users.py
用户管理接口：
- 用户注册
- 用户信息查询
- 用户信息更新
- 用户列表
- 用户激活/停用

### routes/items.py
物品管理接口（模板示例）：
- 物品创建
- 物品查询
- 物品更新
- 物品删除

### routes/production.py
生产管理接口：
- 产线管理
- 工位管理
- 生产计划管理
- 生产记录查询
- 质量指标统计

### routes/anomalies.py
异常分析与管理接口：
- 异常上报
- 异常诊断
- 解决方案推荐
- 工单管理
- 案例库管理

### routes/private.py
私有接口（仅本地环境可用）：
- 开发调试接口
- 系统状态查询

### routes/utils.py
工具接口：
- 通用工具函数
- 辅助功能

## API 版本

所有 API 端点使用版本前缀 `/api/v1`

## 认证方式

使用 JWT Token 进行认证：
- 在请求头中添加 `Authorization: Bearer <token>`
- Token 有效期默认为 8 天

## CORS 配置

支持跨域请求，允许的来源在 `core/config.py` 中配置

## 环境差异

- `local` 环境：包含所有接口，包括私有接口
- `staging`/`production` 环境：不包含私有接口
