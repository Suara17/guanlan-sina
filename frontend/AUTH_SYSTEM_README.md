# 认证系统使用说明

## 概述

天工·弈控应用实现了完整的用户认证系统，包含登录、登出、token管理等功能。

## 架构

### 1. AuthContext (`contexts/AuthContext.tsx`)
认证上下文和提供者组件，管理全局认证状态。

**主要功能：**
- 用户状态管理（用户信息、登录状态、token）
- 登录函数（调用API并更新状态）
- 登出函数（清除token和状态）
- 检查认证状态的函数
- 从localStorage恢复认证状态的功能

### 2. useAuth Hook (`hooks/useAuth.tsx`)
认证相关的自定义hooks，提供便捷的认证状态访问。

### 3. ProtectedRoute (`components/ProtectedRoute.tsx`)
受保护的路由组件，确保只有登录用户才能访问。

### 4. LoginPage (`components/LoginPage.tsx`)
登录页面组件，已更新为使用认证上下文。

## 使用方法

### 基本用法

```tsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <p>欢迎，{user?.username}！</p>
      <button onClick={logout}>退出登录</button>
    </div>
  );
};
```

### 登录流程

```tsx
const handleLogin = async () => {
  const success = await login(username, password);
  if (success) {
    // 登录成功，自动跳转到受保护页面
    console.log('登录成功');
  } else {
    // 登录失败，错误信息会自动显示
    console.log('登录失败');
  }
};
```

### 访问用户信息

```tsx
const { user, isAuthenticated } = useAuth();

if (isAuthenticated && user) {
  console.log('用户名:', user.username);
  console.log('邮箱:', user.email);
  console.log('角色:', user.role);
  console.log('全名:', user.full_name);
}
```

## 路由保护

应用中的 `/app/*` 路径已自动受到保护。未登录用户访问这些路径时会自动重定向到登录页面，登录成功后会回到原本想要访问的页面。

## API 集成

认证系统自动集成了以下API：
- `loginAccessTokenApiV1LoginAccessTokenPost` - 用户登录
- `testTokenApiV1LoginTestTokenPost` - 验证token有效性
- `readUserMeApiV1UsersMeGet` - 获取当前用户信息

## 错误处理

认证系统提供了完善的错误处理：
- 网络错误
- 无效凭据（401错误）
- 服务器错误
- Token过期

所有错误都会通过 `error` 状态显示给用户。

## 安全特性

- Token自动存储在localStorage中
- 应用启动时自动验证token有效性
- Token过期时自动清除并重定向到登录页面
- 敏感信息不会存储在前端

## 注意事项

1. 确保整个应用被 `AuthProvider` 包装
2. 使用 `useAuth` hook时必须在 `AuthProvider` 内部
3. Token会在浏览器关闭后保留，下次打开应用时会自动验证
