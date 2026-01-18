# 组件说明文档

本目录包含"天工·弈控"系统的所有React组件。

## 组件列表

### AiAssistant.tsx
AI智能助手组件，提供产线数据分析和优化建议。

**功能：**
- 聊天界面，显示用户和AI的对话消息
- 一键诊断产线健康，调用 `geminiService` 分析系统健康状况
- 可折叠的浮动窗口，固定在右下角

**Props：**
- `contextData: any` - 传递给AI助手的上下文数据

---

### LandingPage.tsx
产品落地页，展示"天工·弈控"系统介绍。

**内容：**
- 系统名称和定位：面向离散制造业的"视-空协同"智适应操作系统
- 1+N+X 生态架构说明（基础设施层、视觉算法、优化引擎）
- 技术栈展示（FastAPI、React、PostgreSQL等）
- 登录入口按钮

---

### LoginPage.tsx
用户登录页面。

**功能：**
- 邮箱和密码输入表单
- 表单验证（邮箱格式、必填项）
- 密码显示/隐藏切换
- 登录状态加载显示
- 错误提示信息
- 集成 `useAuth` hook 进行认证

---

### ProtectedRoute.tsx
路由保护组件。

**作用：**
- 检查用户是否已登录
- 未认证用户自动重定向到登录页面
- 显示加载状态（认证验证中）
- 保护需要登录才能访问的页面

**Props：**
- `children: React.ReactNode` - 需要保护的路由内容

---

### Sidebar.tsx
侧边导航栏组件。

**导航项：**
- 生产可视化 (`/app/`)
- 司南智控 (`/app/sinan`)
- OS内核接入 (`/app/kernel`)
- 能力商店 (`/app/marketplace`)
- 场景编排 (`/app/builder`)
- 开发者生态 (`/app/ecosystem`)

**功能：**
- 当前页面高亮显示
- 响应式设计（移动端可折叠）
- 系统设置入口

**Props：**
- `currentPath: string` - 当前路由路径
- `onNavigate: (path: string) => void` - 导航回调函数
- `isOpen: boolean` - 侧边栏开关状态

---

### SinanAvatar.tsx
司南智能机器人头像组件。

**模式：**
- `idle` - 空闲状态
- `alert` - 告警状态

**功能：**
- 浮动动画效果
- 气泡提示框（鼠标悬停或告警时显示）
- 告警模式下点击可跳转到分析页面
- 机器人眼睛和天线动画

**Props：**
- `mode: 'idle' | 'alert'` - 工作模式
- `alertMessage?: string` - 告警信息
- `className?: string` - 自定义样式类名

---

### TopBar.tsx
顶部导航栏组件。

**功能：**
- 页面标题显示
- 侧边栏切换按钮（移动端）
- 全局搜索框
- 通知铃铛（带红点提示）
- 用户信息显示（用户名、角色）
- 退出登录按钮

**Props：**
- `title: string` - 页面标题
- `toggleSidebar: () => void` - 切换侧边栏的回调函数

---

## 依赖关系

- **认证系统**：`LoginPage`、`ProtectedRoute`、`TopBar` 依赖 `contexts/AuthContext.tsx` 和 `hooks/useAuth.tsx`
- **路由**：所有页面组件依赖 `react-router-dom`
- **图标库**：使用 `lucide-react` 提供图标
- **样式**：使用 Tailwind CSS 进行样式设计
