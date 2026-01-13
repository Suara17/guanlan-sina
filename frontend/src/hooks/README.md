# 自定义 Hooks 目录

本目录包含应用的自定义 React Hooks，用于封装可复用的逻辑和状态管理。

## 可用 Hooks

### useAuth.ts
认证相关的 Hook，管理用户登录状态和认证令牌。

**功能：**
- 获取当前用户信息
- 检查登录状态
- 处理登录/登出逻辑

### useCopyToClipboard.ts
复制文本到剪贴板的 Hook。

**功能：**
- 将文本复制到系统剪贴板
- 返回复制状态和结果

### useCustomToast.ts
自定义 Toast 通知的 Hook，基于 Sonner 库。

**功能：**
- 显示成功、错误、警告等通知
- 提供统一的 API 调用方式

### useMobile.ts
检测移动设备的 Hook。

**功能：**
- 判断当前设备是否为移动设备
- 响应式布局支持

### useProductionData.ts
生产数据相关的 Hook，使用 TanStack Query 管理数据获取。

**功能：**
- 获取生产数据
- 缓存管理
- 自动重新验证

## 使用示例

```typescript
import { useAuth } from '@/hooks/useAuth'
import { useCustomToast } from '@/hooks/useCustomToast'

function MyComponent() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useCustomToast()

  const handleClick = () => {
    toast.success('操作成功！')
  }

  return <div>{/* 组件内容 */}</div>
}
```

## 最佳实践

1. **单一职责**：每个 Hook 只负责一个特定的功能
2. **可复用性**：设计通用的 Hook，避免组件间重复代码
3. **类型安全**：使用 TypeScript 提供完整的类型定义
4. **性能优化**：合理使用依赖项，避免不必要的重渲染
