# 通用组件

本目录包含可在多个页面复用的通用组件。

## 组件说明

### AuthLayout.tsx
认证页面布局组件。

**功能：**
- 为登录、注册等认证页面提供统一的布局
- 包含 Logo 和居中的表单容器
- 支持主题切换

**使用示例：**
```typescript
<AuthLayout>
  <LoginForm />
</AuthLayout>
```

### DataTable.tsx
通用数据表格组件。

**功能：**
- 基于 TanStack Table 实现
- 支持排序、过滤、分页
- 支持自定义列渲染
- 响应式设计

**使用示例：**
```typescript
import { DataTable } from '@/components/Common/DataTable'
import { columns } from './columns'

<DataTable
  columns={columns}
  data={users}
  searchKey="email"
  searchPlaceholder="搜索邮箱..."
/>
```

### ErrorComponent.tsx
错误提示组件。

**功能：**
- 显示友好的错误信息
- 提供重试或返回首页的选项
- 支持自定义错误消息

**使用示例：**
```typescript
<ErrorComponent
  message="加载失败"
  onRetry={() => refetch()}
/>
```

### Footer.tsx
页脚组件。

**功能：**
- 显示版权信息
- 显示链接（如隐私政策、服务条款）
- 响应式布局

**使用示例：**
```typescript
<Footer />
```

### Logo.tsx
Logo 组件。

**功能：**
- 显示应用 Logo
- 支持不同尺寸
- 支持主题自适应

**使用示例：**
```typescript
<Logo size="large" />
```

### NotFound.tsx
404 页面组件。

**功能：**
- 显示友好的 404 错误页面
- 提供返回首页的链接

**使用示例：**
```typescript
<NotFound />
```

### Appearance.tsx
主题切换组件。

**功能：**
- 切换明暗主题
- 保存用户偏好到本地存储
- 提供下拉菜单选择

**使用示例：**
```typescript
<Appearance />
```

## 设计原则

1. **可复用性**：组件设计为通用用途，可在多处使用
2. **灵活性**：通过 props 支持多种配置选项
3. **一致性**：保持统一的视觉风格和交互模式
4. **无障碍性**：确保所有组件都支持键盘导航和屏幕阅读器
5. **响应式**：在不同屏幕尺寸下都能良好显示

## 使用建议

1. **优先使用**：在开发新功能时，优先查看是否有可复用的通用组件
2. **保持通用**：如果发现特定组件可以通用化，考虑移到此目录
3. **文档完善**：为每个组件提供清晰的 props 文档和使用示例
4. **测试覆盖**：为通用组件编写单元测试
