# 待处理事项组件

本目录包含待处理事项相关的 React 组件。

## 组件说明

### PendingItems.tsx
待处理物品列表组件。

**功能：**
- 显示待处理的物品列表
- 支持批量操作（批准/拒绝）
- 支持搜索和过滤
- 显示物品详情
- 响应式设计

**使用示例：**
```typescript
<PendingItems
  onApprove={(items) => handleApprove(items)}
  onReject={(items) => handleReject(items)}
/>
```

### PendingUsers.tsx
待处理用户列表组件。

**功能：**
- 显示待审核的用户列表
- 支持批量操作（批准/拒绝）
- 支持搜索和过滤
- 显示用户详情
- 响应式设计

**使用示例：**
```typescript
<PendingUsers
  onApprove={(users) => handleApprove(users)}
  onReject={(users) => handleReject(users)}
/>
```

## 数据模型

### PendingItem（待处理物品）
```typescript
interface PendingItem {
  id: string
  name: string
  category: string
  status: 'pending'
  submitted_by: string
  submitted_at: string
  reason?: string
}
```

### PendingUser（待处理用户）
```typescript
interface PendingUser {
  id: string
  email: string
  full_name: string
  status: 'pending'
  submitted_at: string
  role?: string
}
```

## 数据流

1. 从 API 获取待处理数据（使用 TanStack Query）
2. 数据在列表中显示
3. 用户选择要处理的项目
4. 批量或单个批准/拒绝操作
5. 调用 API 更新状态
6. 操作成功后刷新列表

## 操作流程

### 批准流程
1. 选择要批准的项目
2. 点击"批准"按钮
3. 确认操作
4. 调用 API 更新状态为"active"
5. 显示成功提示
6. 刷新列表

### 拒绝流程
1. 选择要拒绝的项目
2. 点击"拒绝"按钮
3. （可选）填写拒绝原因
4. 确认操作
5. 调用 API 更新状态为"rejected"
6. 显示成功提示
7. 刷新列表

## 功能特性

### 搜索和过滤
- 按名称/邮箱搜索
- 按类别/角色过滤
- 按提交时间排序

### 批量操作
- 全选/取消全选
- 批量批准
- 批量拒绝

### 状态显示
- 待处理数量统计
- 实时状态更新
- 操作历史记录

## 注意事项

1. **权限控制**：只有授权用户才能处理待处理事项
2. **操作确认**：重要操作需要二次确认
3. **错误处理**：妥善处理 API 错误
4. **加载状态**：在 API 调用期间显示加载状态
5. **用户反馈**：操作成功/失败后给出明确的反馈
6. **通知机制**：批准/拒绝后通知相关用户（如邮件通知）
7. **审计日志**：记录所有操作，便于追溯
