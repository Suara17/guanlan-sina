# 天工·弈控 - 前端应用

面向离散制造业的"视-空协同"智适应操作系统前端应用。

## 项目概述

天工·弈控是一个面向离散制造业的智能操作系统，基于 1+N+X 生态架构，提供全面的智能化解决方案。

### 核心功能

- **生产可视化** - 实时监控产线状态、产量、质量等关键指标
- **司南智控** - AI 驱动的异常诊断和决策优化
- **OS 内核接入** - 快速连接工业设备，建立数据通道
- **能力商店** - 按需订阅工业算法，即插即用
- **场景编排** - 可视化构建生产流程

## 技术栈

### 前端框架
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router DOM** - 路由管理

### UI 组件与样式
- **Tailwind CSS** - 原子化 CSS 框架
- **Lucide React** - 图标库
- **Recharts** - 数据可视化图表库

### API 客户端
- **@hey-api/openapi-ts** - OpenAPI 代码生成工具
- **Axios** - HTTP 客户端

### AI 集成
- **@google/genai** - Google AI SDK（Gemini）

## 项目结构

```
frontend/
├── components/          # React 组件
│   ├── AiAssistant.tsx          # AI 智能助手
│   ├── LandingPage.tsx          # 产品落地页
│   ├── LoginPage.tsx            # 登录页面
│   ├── ProtectedRoute.tsx       # 路由保护
│   ├── Sidebar.tsx              # 侧边导航栏
│   ├── SinanAvatar.tsx          # 司南机器人头像
│   └── TopBar.tsx               # 顶部导航栏
├── pages/               # 页面组件
│   ├── Dashboard.tsx            # 生产可视化仪表盘
│   ├── KernelConnect.tsx        # OS 内核接入
│   ├── Marketplace.tsx          # 能力商店
│   ├── ScenarioBuilder.tsx      # 场景编排
│   └── SinanAnalysis.tsx        # 司南智能诊断中心
├── contexts/            # React Context
│   └── AuthContext.tsx          # 认证上下文
├── hooks/               # 自定义 Hooks
│   └── useAuth.tsx               # 认证 Hook
├── services/            # 服务层
│   └── geminiService.ts         # Gemini AI 服务
├── src/                 # 自动生成的 API 客户端
│   ├── client/
│   │   ├── client.gen.ts        # 客户端实例
│   │   ├── sdk.gen.ts           # SDK 函数
│   │   └── types.gen.ts         # 类型定义
│   └── index.css                # 全局样式
├── dist/                # 构建输出目录
├── App.tsx              # 应用根组件
├── index.tsx            # 应用入口
├── api.ts               # API 配置
├── types.ts             # 全局类型定义
├── tailwind.config.js   # Tailwind 配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── package.json         # 项目依赖
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local` 文件并配置以下变量：

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000

# Gemini API Key（可选）
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 开发指南

### 生成 API 客户端

当后端 OpenAPI 规范更新时，重新生成 API 客户端：

```bash
npm run generate-client
```

**注意：** 生成的文件（`src/client/client.gen.ts`、`sdk.gen.ts`、`types.gen.ts`）不应手动修改，它们会在重新生成时被覆盖。

### 添加新页面

1. 在 `pages/` 目录创建新页面组件
2. 在 `App.tsx` 中添加路由配置
3. 在 `Sidebar.tsx` 中添加导航项

### 使用 API 客户端

```typescript
import { readUserMeApiV1UsersMeGet } from './src/client';

const result = await readUserMeApiV1UsersMeGet({
  security: [{
    scheme: 'bearer',
    type: 'http'
  }]
});

if (result.data) {
  console.log('User:', result.data);
}
```

### 使用认证系统

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // 使用认证状态和方法
}
```

## 路由配置

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | LandingPage | 产品落地页 |
| `/login` | LoginPage | 登录页面 |
| `/app/` | Dashboard | 生产可视化仪表盘 |
| `/app/sinan` | SinanAnalysis | 司南智能诊断中心 |
| `/app/kernel` | KernelConnect | OS 内核接入 |
| `/app/marketplace` | Marketplace | 能力商店 |
| `/app/builder` | ScenarioBuilder | 场景编排 |

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run generate-client` | 生成 API 客户端 |

## 配置文件

### Vite 配置（vite.config.ts）
- 插件配置
- 开发服务器配置
- 构建优化

### TypeScript 配置（tsconfig.json）
- 编译选项
- 路径别名
- 类型检查

### Tailwind 配置（tailwind.config.js）
- 主题定制
- 插件配置
- 自定义样式

## 认证系统

项目实现了完整的认证系统：

- **登录/登出** - 基于 OAuth2 的令牌认证
- **路由保护** - 未登录用户自动重定向到登录页
- **令牌管理** - 自动刷新和存储访问令牌
- **用户信息** - 获取和更新当前用户信息

详细说明请参考 `AUTH_SYSTEM_README.md`。

## 文档

- [组件说明](./components/README.md)
- [页面说明](./pages/README.md)
- [API 客户端说明](./src/README.md)
- [认证系统说明](./AUTH_SYSTEM_README.md)

## 后端 API

前端通过 OpenAPI 规范与后端通信。后端 API 文档请参考后端项目。

## 常见问题

### 如何配置后端 API 地址？

在 `.env.local` 文件中设置 `VITE_API_BASE_URL` 环境变量。

### 如何添加新的 API 端点？

1. 更新后端的 OpenAPI 规范
2. 运行 `npm run generate-client` 重新生成客户端代码
3. 在页面中导入并使用新生成的函数

### 如何自定义主题？

修改 `tailwind.config.js` 文件中的主题配置。

## 许可证

Copyright © 2024 天工·弈控 智适应操作系统
