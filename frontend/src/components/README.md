# 组件目录

本目录包含前端应用的所有 React 组件。

## 目录结构

### Admin
管理员功能相关组件，包括：
- `AddUser.tsx` - 添加用户对话框
- `EditUser.tsx` - 编辑用户对话框
- `DeleteUser.tsx` - 删除用户对话框
- `UserActionsMenu.tsx` - 用户操作菜单
- `columns.tsx` - 用户表格列定义

### Common
通用组件，可在多个页面复用：
- `AuthLayout.tsx` - 认证页面布局
- `DataTable.tsx` - 数据表格组件
- `ErrorComponent.tsx` - 错误提示组件
- `Footer.tsx` - 页脚组件
- `Logo.tsx` - Logo 组件
- `NotFound.tsx` - 404 页面组件
- `Appearance.tsx` - 主题切换组件

### Dashboard
仪表板相关组件：
- `ProductionChart.tsx` - 生产数据图表
- `YieldCard.tsx` - 产量卡片

### Items
物品管理相关组件：
- `AddItem.tsx` - 添加物品对话框
- `EditItem.tsx` - 编辑物品对话框
- `DeleteItem.tsx` - 删除物品对话框
- `ItemActionsMenu.tsx` - 物品操作菜单
- `columns.tsx` - 物品表格列定义

### Pending
待处理事项相关组件：
- `PendingItems.tsx` - 待处理物品列表
- `PendingUsers.tsx` - 待处理用户列表

### Sidebar
侧边栏相关组件：
- `AppSidebar.tsx` - 应用侧边栏主组件
- `Main.tsx` - 主菜单
- `User.tsx` - 用户菜单

### ui
基础 UI 组件库（基于 Radix UI 和 Tailwind CSS）：
- `alert.tsx` - 警告提示
- `avatar.tsx` - 头像
- `badge.tsx` - 徽章
- `button.tsx` - 按钮
- `button-group.tsx` - 按钮组
- `card.tsx` - 卡片
- `checkbox.tsx` - 复选框
- `dialog.tsx` - 对话框
- `dropdown-menu.tsx` - 下拉菜单
- `form.tsx` - 表单
- `input.tsx` - 输入框
- `label.tsx` - 标签
- `loading-button.tsx` - 加载按钮
- `pagination.tsx` - 分页
- `password-input.tsx` - 密码输入框
- `select.tsx` - 选择器
- `separator.tsx` - 分隔线
- `sheet.tsx` - 侧边面板
- `sidebar.tsx` - 侧边栏
- `skeleton.tsx` - 骨架屏
- `sonner.tsx` - Toast 通知
- `table.tsx` - 表格
- `tabs.tsx` - 标签页
- `tooltip.tsx` - 工具提示

### UserSettings
用户设置相关组件：
- `UserInformation.tsx` - 用户信息编辑
- `ChangePassword.tsx` - 修改密码
- `DeleteAccount.tsx` - 删除账户
- `DeleteConfirmation.tsx` - 删除确认对话框

## 根目录文件

- `theme-provider.tsx` - 主题提供者，支持明暗主题切换

## 设计原则

1. **组件化**：每个组件职责单一，可复用性强
2. **类型安全**：使用 TypeScript 确保类型安全
3. **样式一致**：使用 Tailwind CSS 和 shadcn/ui 组件库保持视觉一致性
4. **无障碍性**：基于 Radix UI 构建，确保良好的无障碍体验
