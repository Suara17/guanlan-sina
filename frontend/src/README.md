# API 客户端说明文档

本目录包含基于 OpenAPI 规范自动生成的 API 客户端代码。

## 目录结构

```
src/
├── client/
│   ├── client.gen.ts          # 客户端实例配置
│   ├── sdk.gen.ts             # SDK 函数集合
│   ├── types.gen.ts           # TypeScript 类型定义
│   ├── index.ts               # 入口文件
│   ├── client/
│   │   ├── client.ts          # HTTP 客户端核心实现
│   │   ├── types.ts           # 客户端类型定义
│   │   ├── utils.ts           # 工具函数
│   │   └── index.ts           # 客户端模块入口
│   └── core/
│       ├── auth.ts            # 认证处理
│       ├── bodySerializer.ts  # 请求体序列化器
│       ├── params.ts          # 参数构建工具
│       ├── pathSerializer.ts  # 路径参数序列化器
│       └── types.ts           # 核心类型定义
└── index.css                  # 全局样式
```

## 核心文件

### client.gen.ts
自动生成的客户端实例配置文件。

**作用：**
- 导出 `client` 实例，用于所有 API 请求
- 基于 `@hey-api/openapi-ts` 自动生成

---

### sdk.gen.ts
自动生成的 SDK 函数集合，包含所有 API 端点的调用函数。

#### 认证相关
- `loginAccessTokenApiV1LoginAccessTokenPost` - 登录获取访问令牌
- `testTokenApiV1LoginTestTokenPost` - 测试令牌有效性
- `recoverPasswordApiV1PasswordRecoveryEmailPost` - 密码恢复
- `resetPasswordApiV1ResetPasswordPost` - 重置密码

#### 用户管理
- `readUsersApiV1UsersGet` - 获取用户列表
- `createUserApiV1UsersPost` - 创建用户
- `readUserMeApiV1UsersMeGet` - 获取当前用户信息
- `updateUserMeApiV1UsersMePatch` - 更新当前用户
- `registerUserApiV1UsersSignupPost` - 用户注册

#### 生产管理
- `readProductionLinesApiV1ProductionLinesGet` - 获取产线列表
- `readProductionOverviewApiV1ProductionOverviewGet` - 获取生产概览
- `getProductionDashboardApiV1ProductionDashboardGet` - 获取生产仪表盘数据

#### 异常诊断
- `readAnomaliesApiV1AnomaliesGet` - 获取异常列表
- `triggerDiagnosisApiV1AnomaliesIdDiagnosePost` - 触发诊断
- `selectSolutionApiV1SolutionsIdSelectPost` - 选择解决方案

#### 案例库
- `readCasesApiV1CasesGet` - 获取案例列表
- `createCaseApiV1CasesPost` - 创建案例

---

### types.gen.ts
自动生成的 TypeScript 类型定义文件。

**主要类型：**
- `Anomaly` - 异常数据模型
- `ProductionDashboardResponse` - 生产仪表盘响应
- `ProductionLine` - 产线数据模型
- `UserPublic` - 用户公开信息
- `SolutionPublic` - 解决方案数据模型
- `CaseLibrary` - 案例库数据模型
- `Token` - 认证令牌
- `DiagnosisPublic` - 诊断结果

---

### client/client.ts
HTTP 客户端核心实现。

**功能：**
- `createClient()` - 创建客户端实例
- `request()` - 核心请求方法
- 支持 GET、POST、PUT、DELETE、PATCH 等所有 HTTP 方法
- 请求/响应拦截器（interceptors）
- 自动处理认证（Bearer Token）
- 自动序列化请求体
- 自动解析响应（JSON、FormData、Blob、Text）

---

### client/utils.ts
客户端工具函数。

**主要函数：**
- `buildUrl()` - 构建完整 URL（包含路径参数和查询参数）
- `mergeConfigs()` - 合并配置
- `mergeHeaders()` - 合并请求头
- `setAuthParams()` - 设置认证参数
- `getParseAs()` - 根据 Content-Type 推断解析方式
- `createInterceptors()` - 创建拦截器
- `createQuerySerializer()` - 创建查询参数序列化器

---

### client/core/auth.ts
认证处理模块。

**功能：**
- `getAuthToken()` - 获取认证令牌
- 支持 Bearer Token 和 Basic Auth
- 支持通过 header、query、cookie 传递认证

---

### client/core/bodySerializer.ts
请求体序列化器。

**序列化器：**
- `formDataBodySerializer` - FormData 序列化
- `jsonBodySerializer` - JSON 序列化
- `urlSearchParamsBodySerializer` - URLSearchParams 序列化

---

### client/core/pathSerializer.ts
路径参数序列化器。

**序列化函数：**
- `serializeArrayParam()` - 序列化数组参数
- `serializeObjectParam()` - 序列化对象参数
- `serializePrimitiveParam()` - 序列化基本类型参数

**支持的序列化风格：**
- `form` - 表单风格
- `deepObject` - 深度对象风格
- `label` - 标签风格
- `matrix` - 矩阵风格
- `simple` - 简单风格

---

### index.css
全局样式文件。

**样式设置：**
- body 的 margin、padding
- 字体族（Inter、system-ui）
- 背景颜色（slate-50）

## 使用示例

### 基本用法

```typescript
import { loginAccessTokenApiV1LoginAccessTokenPost } from './src/client';

// 登录
const result = await loginAccessTokenApiV1LoginAccessTokenPost({
  body: {
    username: 'user@example.com',
    password: 'password123'
  }
});

if (result.data) {
  console.log('Access Token:', result.data.access_token);
}
```

### 使用自定义客户端

```typescript
import { createClient } from './src/client/client';
import { readUserMeApiV1UsersMeGet } from './src/client';

// 创建自定义客户端
const customClient = createClient({
  baseUrl: 'https://api.example.com',
  headers: {
    'X-Custom-Header': 'value'
  }
});

// 使用自定义客户端
const result = await readUserMeApiV1UsersMeGet({
  client: customClient,
  security: [{
    scheme: 'bearer',
    type: 'http'
  }]
});
```

### 使用拦截器

```typescript
import { client } from './src/client/client.gen';

// 请求拦截器
client.interceptors.request.use(async (request) => {
  console.log('Request:', request);
  return request;
});

// 响应拦截器
client.interceptors.response.use(async (response) => {
  console.log('Response:', response);
  return response;
});

// 错误拦截器
client.interceptors.error.use(async (error) => {
  console.error('Error:', error);
  return error;
});
```

## 生成方式

这些文件由 `@hey-api/openapi-ts` 工具基于后端的 OpenAPI 规范自动生成，配置文件为 `openapi-ts.config.ts`。

**重新生成：**
```bash
npx openapi-ts
```

## 注意事项

- **不要手动修改** `client.gen.ts`、`sdk.gen.ts`、`types.gen.ts` 文件，它们会在重新生成时被覆盖
- 如需自定义客户端配置，使用 `createClient()` 创建新实例
- 所有 API 函数都支持泛型参数 `ThrowOnError`，设置为 `true` 时会在错误时抛出异常
- 默认响应样式为 `'fields'`，返回 `{ data, error, request, response }` 对象
- 可设置 `responseStyle: 'data'` 直接返回数据

## 依赖关系

- **@hey-api/openapi-ts** - OpenAPI 代码生成工具
- **Fetch API** - 原生 HTTP 请求接口
- **TypeScript** - 类型系统支持

---

## 核心概念

这些文件就像一个**翻译器**，帮助前端和后端进行对话。

### 餐厅类比

- **sdk.gen.ts** - 菜单，告诉你有哪些接口可以调用
- **types.gen.ts** - 说明书，告诉每个数据长什么样
- **client.gen.ts** - 服务员，负责把你的请求送到后端
- **client/client.ts** - 厨房，处理具体的请求工作

### 为什么需要这些文件？

假设后端有一个登录接口：
```
POST /api/v1/login/access-token
```

**没有这些文件时**，你需要手动写代码：
- 容易写错 URL
- 容易写错请求头
- 不知道返回数据的格式
- 没有类型检查

**有了这些文件后**，直接调用函数：
- ✅ 不会写错 URL
- ✅ 自动处理请求头
- ✅ 有类型提示（知道返回什么数据）
- ✅ 有错误处理

### 工作流程

```
你在代码中调用函数
    ↓
sdk.gen.ts 中的函数（菜单）
    ↓
client.gen.ts 中的 client 实例（服务员）
    ↓
client/client.ts 处理请求细节（厨房）
    ↓
发送到后端 API
    ↓
返回数据
    ↓
types.gen.ts 告诉你数据的类型（说明书）
```

---

## 前端页面使用流程

### 第一步：导入"菜单"

在前端页面文件（比如 `LoginPage.tsx`）里，首先要告诉系统你想用哪个接口。

就像你走进餐厅，先要看菜单，决定点什么菜。

### 第二步：调用函数

当用户在页面进行操作（比如点击登录按钮）时，页面会调用相应的函数。

就像你告诉服务员："我要点这个菜"。

**这时候发生的事情：**
1. 页面把用户输入的数据传给函数
2. 函数把这些信息打包好

### 第三步：自动处理

函数调用后，那些自动生成的文件就开始工作了：

1. **服务员**（client）接收请求
2. **厨房**（client/client.ts）处理请求：
   - 添加正确的请求头
   - 把数据转换成后端能理解的格式
   - 发送到后端服务器
3. 等待后端返回结果

### 第四步：接收结果

后端处理完后，返回结果，页面根据结果进行相应的操作：
- 成功：显示数据、跳转页面等
- 失败：显示错误提示

### 页面不需要关心的事情

- ❌ URL 是什么
- ❌ 请求头怎么写
- ❌ 数据怎么序列化
- ❌ 错误怎么处理

### 页面只需要关心的事情

- ✅ 调用哪个函数
- ✅ 传递什么数据
- ✅ 怎么处理返回结果

### 实际例子

**登录页面（LoginPage.tsx）：**
1. 用户输入邮箱和密码
2. 点击"登录"按钮
3. 页面调用登录函数
4. 自动生成的文件处理所有细节
5. 后端返回结果
6. 页面根据结果：
   - 成功：保存令牌，跳转到主页
   - 失败：显示错误提示

**生产仪表盘页面（Dashboard.tsx）：**
1. 页面加载时，需要获取生产数据
2. 调用"获取生产仪表盘"函数
3. 自动生成的文件负责发送请求
4. 后端返回生产数据（产量、良率、缺陷率等）
5. 页面用这些数据画图表

### 总结

**前端页面使用这些文件的方式：**

1. **导入** - 需要什么功能就导入什么函数
2. **调用** - 传递数据，调用函数
3. **等待** - 自动生成的文件处理所有细节
4. **处理结果** - 根据返回结果更新页面

**类比：**
- 你是顾客（前端页面）
- 自动生成的文件是餐厅的整个服务系统
- 你只需要点菜（调用函数），不需要知道菜怎么做（底层细节）

**一句话：前端页面就像使用遥控器，按一下按钮，自动生成的文件帮你完成所有复杂的工作。**
