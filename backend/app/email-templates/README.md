# Email Templates 目录说明

本目录包含应用程序的邮件模板，使用 MJML 格式编写，支持响应式邮件设计。

## 目录结构

```
email-templates/
├── build/                  # 编译后的 HTML 模板
│   ├── new_account.html    # 新账户欢迎邮件
│   ├── reset_password.html # 密码重置邮件
│   └── test_email.html     # 测试邮件
└── src/                    # MJML 源文件
    ├── new_account.mjml    # 新账户欢迎邮件源码
    ├── reset_password.mjml # 密码重置邮件源码
    └── test_email.mjml     # 测试邮件源码
```

## 模板说明

### new_account.mjml / new_account.html
新账户欢迎邮件：
- 发送给新注册的用户
- 包含欢迎信息和账户详情
- 提供登录链接

### reset_password.mjml / reset_password.html
密码重置邮件：
- 用户请求重置密码时发送
- 包含密码重置令牌和链接
- 链接有效期 48 小时

### test_email.mjml / test_email.html
测试邮件：
- 用于测试邮件发送功能
- 验证 SMTP 配置是否正确
- 包含基本的邮件格式测试

## MJML 简介

MJML 是一种响应式邮件标记语言，能够生成兼容各大邮件客户端的 HTML。

**优点：**
- 响应式设计，支持移动端
- 跨邮件客户端兼容性好
- 语法简洁，易于维护
- 支持组件化开发

## 编译模板

将 MJML 源文件编译为 HTML：

```bash
# 安装 MJML
npm install -g mjml

# 编译单个文件
mjml src/new_account.mjml -o build/new_account.html

# 编译所有文件
mjml -r src/ -o build/
```

## 邮件配置

邮件发送配置在 `app/core/config.py` 中：

```python
SMTP_HOST: str | None = None
SMTP_PORT: int = 587
SMTP_TLS: bool = True
SMTP_SSL: bool = False
SMTP_USER: str | None = None
SMTP_PASSWORD: str | None = None
EMAILS_FROM_EMAIL: EmailStr | None = None
EMAILS_FROM_NAME: str | None = None
```

## 使用模板

在代码中使用模板发送邮件：

```python
from app.core.email import send_email

# 读取 HTML 模板
with open("app/email-templates/build/new_account.html", "r") as f:
    html_content = f.read()

# 发送邮件
send_email(
    to_email=user.email,
    subject="欢迎注册",
    html_content=html_content
)
```

## 自定义模板

创建新的邮件模板：

1. 在 `src/` 目录创建 `.mjml` 文件
2. 使用 MJML 语法编写模板
3. 编译为 HTML 文件到 `build/` 目录
4. 在代码中引用编译后的 HTML 文件

## 注意事项

⚠️ **重要：**
1. 始终使用编译后的 HTML 文件，不要直接使用 MJML 源文件
2. 在修改模板后，记得重新编译
3. 测试邮件在不同客户端的显示效果
4. 避免使用不兼容的 CSS 样式
5. 图片使用绝对路径或 CDN 地址
6. 邮件内容应简洁明了，突出重点

## 邮件客户端兼容性

MJML 生成的 HTML 支持以下邮件客户端：
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Thunderbird
- 以及其他主流邮件客户端
