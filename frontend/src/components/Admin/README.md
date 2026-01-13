# 管理员组件

本目录包含管理员功能相关的 React 组件。

## 组件说明

### AddUser.tsx
添加用户对话框组件。

**功能：**
- 显示添加用户表单
- 验证用户输入
- 调用 API 创建新用户
- 显示操作结果

**使用示例：**
```typescript
<AddUser onSuccess={() => refetch()} />
```

### EditUser.tsx
编辑用户对话框组件。

**功能：**
- 显示编辑用户表单
- 预填充用户信息
- 验证用户输入
- 调用 API 更新用户
- 显示操作结果

**使用示例：**
```typescript
<EditUser user={user} onSuccess={() => refetch()} />
```

### DeleteUser.tsx
删除用户对话框组件。

**功能：**
- 显示删除确认对话框
- 调用 API 删除用户
- 显示操作结果

**使用示例：**
```typescript
<DeleteUser user={user} onSuccess={() => refetch()} />
```

### UserActionsMenu.tsx
用户操作菜单组件。

**功能：**
- 提供用户操作下拉菜单
- 包含编辑、删除等操作
- 根据权限显示不同选项

**使用示例：**
```typescript
<UserActionsMenu user={user} onEdit={() => {}} onDelete={() => {}} />
```

### columns.tsx
用户表格列定义。

**功能：**
- 定义用户数据表格的列
- 包含用户头像、姓名、邮箱、角色等信息
- 提供操作列

**使用示例：**
```typescript
import { columns } from './columns'
import { DataTable } from '@/components/Common/DataTable'

<DataTable columns={columns} data={users} />
```

## 数据流

1. 用户列表从 API 获取（使用 TanStack Query）
2. 用户数据在表格中显示
3. 通过操作菜单触发编辑/删除操作
4. 弹出对应的对话框组件
5. 用户确认后调用 API
6. 操作成功后刷新数据列表

## 注意事项

1. **权限控制**：只有管理员角色才能访问这些功能
2. **数据验证**：所有表单输入都需要验证
3. **错误处理**：妥善处理 API 错误，显示友好的错误提示
4. **加载状态**：在 API 调用期间显示加载状态
5. **用户反馈**：操作成功/失败后给出明确的反馈
