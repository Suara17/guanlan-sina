# 测试工具目录

本目录包含 Playwright 测试的辅助工具和实用函数。

## 工具说明

### mailcatcher.ts
Mailcatcher 邮件服务集成工具。

**功能：**
- 与 Mailcatcher 服务交互
- 获取测试邮件
- 解析邮件内容
- 提取验证链接

**主要方法：**
- `getLastEmail()` - 获取最后一封邮件
- `getEmails()` - 获取所有邮件
- `clearEmails()` - 清空邮件
- `extractLink(email, text)` - 从邮件中提取链接

**使用示例：**
```typescript
import { getLastEmail, extractLink } from './mailcatcher'

// 获取最后一封邮件
const email = await getLastEmail()

// 提取重置密码链接
const resetLink = extractLink(email, '重置密码')

// 访问链接
await page.goto(resetLink)
```

### privateApi.ts
私有 API 调用工具。

**功能：**
- 直接调用后端 API（绕过前端）
- 用于测试数据准备
- 用于测试数据清理

**主要方法：**
- `createUser(data)` - 创建用户
- `createItem(data)` - 创建物品
- `deleteUser(id)` - 删除用户
- `deleteItem(id)` - 删除物品
- `cleanup()` - 清理测试数据

**使用示例：**
```typescript
import { createUser, cleanup } from './privateApi'

test('测试用户登录', async ({ page }) => {
  // 创建测试用户
  const user = await createUser({
    email: 'test@example.com',
    password: 'password123',
  })

  try {
    // 执行测试
    await page.goto('/login')
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  } finally {
    // 清理测试数据
    await cleanup()
  }
})
```

### random.ts
随机数据生成器。

**功能：**
- 生成随机邮箱
- 生成随机用户名
- 生成随机密码
- 生成随机字符串
- 生成随机数字

**主要方法：**
- `randomEmail()` - 生成随机邮箱
- `randomUsername()` - 生成随机用户名
- `randomPassword()` - 生成随机密码
- `randomString(length)` - 生成随机字符串
- `randomNumber(min, max)` - 生成随机数字

**使用示例：**
```typescript
import { randomEmail, randomPassword } from './random'

const email = randomEmail()
const password = randomPassword()

console.log(email) // 例如: user_abc123@example.com
console.log(password) // 例如: Xy7#pQ9$mL2@
```

### user.ts
用户测试数据工具。

**功能：**
- 创建测试用户数据
- 管理用户凭据
- 提供预设用户数据

**主要方法：**
- `createTestUser(overrides)` - 创建测试用户
- `getAdminUser()` - 获取管理员用户
- `getRegularUser()` - 获取普通用户
- `validateUser(user)` - 验证用户数据

**使用示例：**
```typescript
import { createTestUser, getAdminUser } from './user'

// 创建测试用户
const user = createTestUser({
  email: 'custom@example.com',
  role: 'admin',
})

// 获取预设管理员
const admin = getAdminUser()

// 使用用户登录
await page.goto('/login')
await page.fill('input[name="email"]', admin.email)
await page.fill('input[name="password"]', admin.password)
```

## 使用场景

### 1. 测试数据准备

```typescript
import { createUser, randomEmail, randomPassword } from './utils'

test('测试功能', async ({ page }) => {
  // 生成随机用户数据
  const email = randomEmail()
  const password = randomPassword()

  // 创建用户
  const user = await createUser({ email, password })

  // 执行测试
  // ...
})
```

### 2. 邮件验证测试

```typescript
import { getLastEmail, extractLink } from './utils/mailcatcher'

test('测试邮件验证', async ({ page }) => {
  // 触发发送邮件
  await page.click('button[data-testid="send-email"]')

  // 获取邮件
  const email = await getLastEmail()

  // 提取验证链接
  const link = extractLink(email, '验证邮箱')

  // 访问链接
  await page.goto(link)
})
```

### 3. 测试数据清理

```typescript
import { cleanup } from './utils/privateApi'

test.afterEach(async () => {
  // 每个测试后清理数据
  await cleanup()
})
```

## 最佳实践

1. **数据隔离**：每个测试使用独立的数据，避免相互影响
2. **随机数据**：使用随机数据生成器，避免硬编码
3. **清理数据**：测试后及时清理创建的数据
4. **错误处理**：妥善处理 API 调用错误
5. **可读性**：使用有意义的变量名和方法名
6. **复用性**：将常用逻辑提取为工具函数

## 注意事项

1. **服务依赖**：某些工具需要后端服务运行
2. **邮件服务**：Mailcatcher 工具需要 Mailcatcher 服务运行
3. **权限控制**：私有 API 需要管理员权限
4. **性能优化**：避免在测试中创建过多数据
5. **并发安全**：确保工具函数支持并发调用
