# 端到端测试目录

本目录包含使用 Playwright 编写的端到端（E2E）测试。

## 目录结构

### 测试文件

- `auth.setup.ts` - 认证测试设置，用于在测试前登录
- `config.ts` - Playwright 测试配置
- `login.spec.ts` - 登录功能测试
- `sign-up.spec.ts` - 注册功能测试
- `reset-password.spec.ts` - 重置密码功能测试
- `user-settings.spec.ts` - 用户设置功能测试
- `flow.spec.ts` - 完整业务流程测试

### 工具目录 (`utils/`)

测试辅助工具和实用函数：

- `mailcatcher.ts` - Mailcatcher 邮件服务集成
- `privateApi.ts` - 私有 API 调用工具
- `random.ts` - 随机数据生成器
- `user.ts` - 用户测试数据工具

## 测试环境要求

运行测试前需要：

1. **启动后端服务**
   ```bash
   docker compose up -d --wait backend
   ```

2. **安装 Playwright 浏览器**
   ```bash
   npx playwright install
   ```

## 运行测试

### 运行所有测试

```bash
npx playwright test
```

### 运行特定测试文件

```bash
npx playwright test login.spec.ts
```

### 运行特定测试用例

```bash
npx playwright test -g "登录成功"
```

### UI 模式运行（推荐用于调试）

```bash
npx playwright test --ui
```

### 显示浏览器运行

```bash
npx playwright test --headed
```

### 调试模式

```bash
npx playwright test --debug
```

## 测试报告

### 查看测试报告

```bash
npx playwright show-report
```

测试报告会自动生成在 `playwright-report` 目录中。

### 查看测试结果

HTML 报告：`playwright-report/index.html`

## 编写测试

### 基本测试结构

```typescript
import { test, expect } from '@playwright/test'

test('测试标题', async ({ page }) => {
  // 导航到页面
  await page.goto('/login')

  // 执行操作
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // 验证结果
  await expect(page).toHaveURL('/dashboard')
})
```

### 使用认证设置

```typescript
import { test, expect } from '@playwright/test'
import { authenticate } from './auth.setup'

test.use(authenticate)

test('需要认证的测试', async ({ page }) => {
  // 此测试会自动登录
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/dashboard')
})
```

### 使用测试工具

```typescript
import { test } from '@playwright/test'
import { randomEmail, randomPassword } from './utils/random'
import { createUserViaAPI } from './utils/user'

test('创建用户测试', async ({ page }) => {
  const email = randomEmail()
  const password = randomPassword()

  // 使用 API 创建用户
  await createUserViaAPI({ email, password })

  // 测试登录
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
})
```

## 测试最佳实践

1. **独立性**：每个测试应该独立运行，不依赖其他测试
2. **可读性**：使用描述性的测试名称和清晰的测试步骤
3. **等待策略**：使用 Playwright 的自动等待机制，避免硬编码等待
4. **选择器**：使用稳定的元素选择器（如 `data-testid`）
5. **清理**：测试后清理创建的数据
6. **复用**：将通用逻辑提取到工具函数中

## 清理测试数据

测试完成后，清理 Docker 容器和数据：

```bash
docker compose down -v
```

## 注意事项

1. **后端依赖**：测试需要后端服务运行
2. **数据隔离**：每个测试应该使用独立的数据，避免相互影响
3. **邮件服务**：某些测试需要 Mailcatcher 服务运行
4. **浏览器兼容性**：测试在多个浏览器上运行，确保跨浏览器兼容性
5. **CI/CD 集成**：测试可以集成到 CI/CD 流程中
