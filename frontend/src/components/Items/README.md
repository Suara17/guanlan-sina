# 物品管理组件

本目录包含物品管理功能相关的 React 组件。

## 组件说明

### AddItem.tsx
添加物品对话框组件。

**功能：**
- 显示添加物品表单
- 验证物品信息
- 调用 API 创建新物品
- 显示操作结果

**使用示例：**
```typescript
<AddItem onSuccess={() => refetch()} />
```

### EditItem.tsx
编辑物品对话框组件。

**功能：**
- 显示编辑物品表单
- 预填充物品信息
- 验证物品输入
- 调用 API 更新物品
- 显示操作结果

**使用示例：**
```typescript
<EditItem item={item} onSuccess={() => refetch()} />
```

### DeleteItem.tsx
删除物品对话框组件。

**功能：**
- 显示删除确认对话框
- 调用 API 删除物品
- 显示操作结果

**使用示例：**
```typescript
<DeleteItem item={item} onSuccess={() => refetch()} />
```

### ItemActionsMenu.tsx
物品操作菜单组件。

**功能：**
- 提供物品操作下拉菜单
- 包含编辑、删除等操作
- 根据权限显示不同选项

**使用示例：**
```typescript
<ItemActionsMenu item={item} onEdit={() => {}} onDelete={() => {}} />
```

### columns.tsx
物品表格列定义。

**功能：**
- 定义物品数据表格的列
- 包含物品名称、类别、状态、数量等信息
- 提供操作列

**使用示例：**
```typescript
import { columns } from './columns'
import { DataTable } from '@/components/Common/DataTable'

<DataTable columns={columns} data={items} />
```

## 数据模型

### Item（物品）
```typescript
interface Item {
  id: string
  name: string
  category: string
  status: 'active' | 'inactive' | 'pending'
  quantity: number
  created_at: string
  updated_at: string
}
```

## 数据流

1. 物品列表从 API 获取（使用 TanStack Query）
2. 物品数据在表格中显示
3. 通过操作菜单触发编辑/删除操作
4. 弹出对应的对话框组件
5. 用户确认后调用 API
6. 操作成功后刷新数据列表

## 表单验证

### 添加/编辑物品验证规则
- **名称**：必填，长度 2-100 字符
- **类别**：必填，从预定义列表中选择
- **状态**：必填，从预定义列表中选择
- **数量**：必填，非负整数

## 注意事项

1. **权限控制**：只有授权用户才能添加/编辑/删除物品
2. **数据验证**：所有表单输入都需要验证
3. **错误处理**：妥善处理 API 错误，显示友好的错误提示
4. **加载状态**：在 API 调用期间显示加载状态
5. **用户反馈**：操作成功/失败后给出明确的反馈
6. **批量操作**：考虑支持批量删除、批量更新等功能
7. **搜索过滤**：支持按名称、类别、状态搜索和过滤
