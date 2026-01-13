# 路由目录

本目录包含应用的所有路由配置和页面组件，基于 TanStack Router 实现。

## 目录结构

### 根路由文件

- `__root.tsx` - 应用的根路由，包含全局布局和提供者
- `_layout.tsx` - 主布局组件
- `index.tsx` - 首页

### 认证路由

- `login.tsx` - 登录页面
- `signup.tsx` - 注册页面
- `recover-password.tsx` - 找回密码页面
- `reset-password.tsx` - 重置密码页面

### 布局路由目录 (`_layout/`)

包含需要认证保护的页面路由：

- `admin.tsx` - 管理员页面
- `dashboard.tsx` - 仪表板页面
- `items.tsx` - 物品管理页面
- `settings.tsx` - 设置页面
- `alerts/` - 告警相关页面
  - `index.tsx` - 告警列表页面
  - `$alertId.tsx` - 告警详情页面（动态路由）

## 路由特性

### TanStack Router
使用 TanStack Router 作为路由解决方案，提供以下特性：

- **类型安全**：完整的 TypeScript 支持
- **代码分割**：自动路由代码分割
- **嵌套路由**：支持嵌套布局和路由
- **数据加载**：内置数据加载和缓存
- **搜索参数**：类型安全的 URL 搜索参数管理
- **路由守卫**：基于路由的权限控制

### 路由保护
需要认证的页面放在 `_layout/` 目录下，通过布局组件进行保护：
- 检查用户登录状态
- 未登录用户自动重定向到登录页

### 动态路由
使用 `$param` 语法定义动态路由参数，例如 `$alertId.tsx`。

## 使用示例

### 创建新路由

1. 在 `routes/` 或 `routes/_layout/` 目录下创建新文件
2. 使用 TanStack Router 的 API 定义路由组件
3. 运行 `npm run dev` 自动生成路由类型

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/new-page')({
  component: NewPage,
})

function NewPage() {
  return <div>新页面内容</div>
}
```

### 路由导航

```typescript
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate({ to: '/dashboard' })
  }

  return <button onClick={handleClick}>跳转到仪表板</button>
}
```

### 路由参数

```typescript
// 获取路由参数
const { alertId } = Route.useParams()

// 获取搜索参数
const { search } = Route.useSearch()
```

## 注意事项

1. **文件命名**：路由文件名对应 URL 路径
2. **自动生成**：路由类型文件 `routeTree.gen.ts` 会自动生成，不要手动修改
3. **类型安全**：充分利用 TanStack Router 的类型系统，避免硬编码 URL
4. **权限控制**：敏感页面放在 `_layout/` 目录下进行保护
