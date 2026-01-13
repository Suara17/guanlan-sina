# 用户设置组件

本目录包含用户账户设置相关的 React 组件。

## 组件说明

### UserInformation.tsx
用户信息编辑组件。

**功能：**
- 显示当前用户信息
- 编辑用户基本信息
- 验证输入数据
- 调用 API 更新用户信息
- 显示操作结果

**字段：**
- 姓名
- 邮箱
- 头像
- 个人简介

**使用示例：**
```typescript
<UserInformation user={user} onUpdate={() => refetch()} />
```

### ChangePassword.tsx
修改密码组件。

**功能：**
- 修改用户密码
- 验证当前密码
- 验证新密码强度
- 确认新密码
- 调用 API 更新密码
- 显示操作结果

**字段：**
- 当前密码
- 新密码
- 确认新密码

**密码要求：**
- 最少 8 个字符
- 包含大小写字母
- 包含数字
- 包含特殊字符

**使用示例：**
```typescript
<ChangePassword onSuccess={() => toast.success('密码修改成功')} />
```

### DeleteAccount.tsx
删除账户组件。

**功能：**
- 显示删除账户警告
- 要求输入密码确认
- 调用 API 删除账户
- 显示操作结果
- 登出并重定向

**使用示例：**
```typescript
<DeleteAccount onSuccess={() => {
  toast.success('账户已删除')
  logout()
}} />
```

### DeleteConfirmation.tsx
删除确认对话框组件。

**功能：**
- 显示删除确认对话框
- 显示删除后果警告
- 要求输入确认文本
- 防止误操作

**使用示例：**
```typescript
<DeleteConfirmation
  title="删除账户"
  description="此操作不可撤销，所有数据将被永久删除"
  confirmText="DELETE"
  onConfirm={() => handleDelete()}
/>
```

## 数据模型

### UserInformation（用户信息）
```typescript
interface UserInformation {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  bio?: string
  updated_at: string
}
```

### ChangePasswordForm（修改密码表单）
```typescript
interface ChangePasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}
```

## 安全考虑

### 密码修改
1. 验证当前密码是否正确
2. 新密码不能与旧密码相同
3. 新密码符合强度要求
3. 确认密码与新密码一致
4. 修改成功后清除所有会话

### 账户删除
1. 要求输入密码验证身份
2. 显示详细的删除后果警告
3. 要求输入确认文本（如 "DELETE"）
4. 删除后无法恢复
5. 删除成功后立即登出

## 数据流

1. 用户进入设置页面
2. 显示当前用户信息
3. 用户修改信息
4. 表单验证
5. 调用 API 更新
6. 显示操作结果
7. 更新本地状态

## 表单验证

### 用户信息验证
- **姓名**：必填，长度 2-50 字符
- **邮箱**：必填，有效的邮箱格式
- **头像**：可选，有效的 URL
- **个人简介**：可选，最多 500 字符

### 密码修改验证
- **当前密码**：必填
- **新密码**：必填，符合强度要求
- **确认密码**：必填，与新密码一致

## 注意事项

1. **安全第一**：所有敏感操作都需要密码验证
2. **数据验证**：所有输入都需要严格验证
3. **错误处理**：妥善处理 API 错误，显示友好的错误提示
4. **加载状态**：在 API 调用期间显示加载状态
5. **用户反馈**：操作成功/失败后给出明确的反馈
6. **防误操作**：重要操作需要二次确认
7. **隐私保护**：删除账户前告知数据删除范围
8. **会话管理**：密码修改后清除其他会话
