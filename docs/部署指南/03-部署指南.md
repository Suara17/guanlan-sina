# FastAPI 项目 - 部署

您可以使用 Docker Compose 将项目部署到远程服务器。

本项目期望您有一个 Traefik 代理来处理与外界的通信和 HTTPS 证书。

您可以使用 CI/CD（持续集成和持续部署）系统自动部署，已经有配置可以使用 GitHub Actions 来实现。

但首先您需要配置一些内容。🤓

## 准备工作

* 准备好一个可用的远程服务器。
* 配置您域名的 DNS 记录，使其指向您刚刚创建的服务器的 IP。
* 为您的域名配置一个通配符子域名，这样您就可以为不同的服务设置多个子域名，例如 `*.fastapi-project.example.com`。这对于访问不同的组件很有用，比如 `dashboard.fastapi-project.example.com`、`api.fastapi-project.example.com`、`traefik.fastapi-project.example.com`、`adminer.fastapi-project.example.com` 等。对于 `staging` 环境也很有用，比如 `dashboard.staging.fastapi-project.example.com`、`adminer.staging.fastapi-project.example.com` 等。
* 在远程服务器上安装并配置 [Docker](https://docs.docker.com/engine/install/)（Docker Engine，而不是 Docker Desktop）。

## 公共 Traefik

我们需要一个 Traefik 代理来处理传入的连接和 HTTPS 证书。

您只需要执行以下步骤一次。

### Traefik Docker Compose

* 创建一个远程目录来存储您的 Traefik Docker Compose 文件：

```bash
mkdir -p /root/code/traefik-public/
```

将 Traefik Docker Compose 文件复制到您的服务器。您可以在本地终端中运行命令 `rsync` 来完成：

```bash
rsync -a docker-compose.traefik.yml root@your-server.example.com:/root/code/traefik-public/
```

### Traefik 公共网络

这个 Traefik 将期望一个名为 `traefik-public` 的 Docker "公共网络" 来与您的堆栈通信。

这样，将有一个单一的公共 Traefik 代理来处理与外界的通信（HTTP 和 HTTPS），而在其后，您可以有一个或多个具有不同域名的堆栈，即使它们在同一个单一服务器上。

要创建一个名为 `traefik-public` 的 Docker "公共网络"，请在您的远程服务器上运行以下命令：

```bash
docker network create traefik-public
```

### Traefik 环境变量

Traefik Docker Compose 文件期望在启动之前在终端中设置一些环境变量。您可以通过在远程服务器上运行以下命令来完成。

* 创建 HTTP 基本身份验证的用户名，例如：

```bash
export USERNAME=admin
```

* 创建一个包含 HTTP 基本身份验证密码的环境变量，例如：

```bash
export PASSWORD=changethis
```

* 使用 openssl 生成 HTTP 基本身份验证密码的"哈希"版本，并将其存储在环境变量中：

```bash
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
```

要验证哈希密码是否正确，您可以打印它：

```bash
echo $HASHED_PASSWORD
```

* 创建一个包含服务器域名环境变量，例如：

```bash
export DOMAIN=fastapi-project.example.com
```

* 创建一个包含 Let's Encrypt 邮箱的环境变量，例如：

```bash
export EMAIL=admin@example.com
```

**注意**：您需要设置一个不同的邮箱，`@example.com` 的邮箱将无法工作。

### 启动 Traefik Docker Compose

进入您在远程服务器上复制 Traefik Docker Compose 文件的目录：

```bash
cd /root/code/traefik-public/
```

现在，在设置了环境变量并放置了 `docker-compose.traefik.yml` 之后，您可以通过运行以下命令启动 Traefik Docker Compose：

```bash
docker compose -f docker-compose.traefik.yml up -d
```

## 部署 FastAPI 项目

现在您已经配置好了 Traefik，可以使用 Docker Compose 部署您的 FastAPI 项目了。

**注意**：您可能想跳到关于使用 GitHub Actions 进行持续部署的部分。

## 环境变量

您需要先设置一些环境变量。

设置 `ENVIRONMENT`，默认为 `local`（用于开发），但在部署到服务器时，您会使用类似 `staging` 或 `production` 的值：

```bash
export ENVIRONMENT=production
```

设置 `DOMAIN`，默认为 `localhost`（用于开发），但在部署时，您会使用自己的域名，例如：

```bash
export DOMAIN=fastapi-project.example.com
```

您可以设置多个变量，例如：

* `PROJECT_NAME`：项目名称，用于 API 文档和电子邮件。
* `STACK_NAME`：用于 Docker Compose 标签和项目名称的堆栈名称，对于 `staging`、`production` 等应该是不同的。您可以使用相同的域名，用连字符替换点，例如 `fastapi-project-example-com` 和 `staging-fastapi-project-example-com`。
* `BACKEND_CORS_ORIGINS`：允许的 CORS 源列表，用逗号分隔。
* `SECRET_KEY`：FastAPI 项目的密钥，用于签名令牌。
* `FIRST_SUPERUSER`：第一个超级用户的电子邮件，该超级用户将是可以创建新用户的用户。
* `FIRST_SUPERUSER_PASSWORD`：第一个超级用户的密码。
* `SMTP_HOST`：用于发送电子邮件的 SMTP 服务器主机，这将来自您的电子邮件提供商（例如 Mailgun、Sparkpost、Sendgrid 等）。
* `SMTP_USER`：用于发送电子邮件的 SMTP 服务器用户。
* `SMTP_PASSWORD`：用于发送电子邮件的 SMTP 服务器密码。
* `EMAILS_FROM_EMAIL`：用于发送电子邮件的电子邮件帐户。
* `POSTGRES_SERVER`：PostgreSQL 服务器的主机名。您可以保留默认值 `db`，由同一个 Docker Compose 提供。通常您不需要更改它，除非您使用第三方提供商。
* `POSTGRES_PORT`：PostgreSQL 服务器的端口。您可以保留默认值。通常您不需要更改它，除非您使用第三方提供商。
* `POSTGRES_PASSWORD`：Postgres 密码。
* `POSTGRES_USER`：Postgres 用户，您可以保留默认值。
* `POSTGRES_DB`：用于此应用程序的数据库名称。您可以保留默认值 `app`。
* `SENTRY_DSN`：Sentry 的 DSN，如果您使用它。

## GitHub Actions 环境变量

有一些环境变量仅由 GitHub Actions 使用，您可以配置：

* `LATEST_CHANGES`：由 GitHub Action [latest-changes](https://github.com/tiangolo/latest-changes) 使用，用于根据合并的 PR 自动添加发布说明。这是一个个人访问令牌，请阅读文档以获取详细信息。
* `SMOKESHOW_AUTH_KEY`：用于使用 [Smokeshow](https://github.com/samuelcolvin/smokeshow) 处理和发布代码覆盖率，请按照他们的说明创建一个（免费）Smokeshow 密钥。

### 生成密钥

`.env` 文件中的某些环境变量的默认值为 `changethis`。

您必须使用密钥更改它们，要生成密钥，您可以运行以下命令：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

复制内容并将其用作密码/密钥。然后再次运行它以生成另一个安全密钥。

### 使用 Docker Compose 部署

在设置了环境变量之后，您可以使用 Docker Compose 进行部署：

```bash
docker compose -f docker-compose.yml up -d
```

对于生产环境，您不希望 `docker-compose.override.yml` 中的覆盖，这就是为什么我们明确指定 `docker-compose.yml` 作为要使用的文件。

## 持续部署（CD）

您可以使用 GitHub Actions 自动部署您的项目。😎

您可以拥有多个环境部署。

已经配置了两个环境，`staging` 和 `production`。🚀

### 安装 GitHub Actions Runner

* 在您的远程服务器上，为您的 GitHub Actions 创建一个用户：

```bash
sudo adduser github
```

* 为 `github` 用户添加 Docker 权限：

```bash
sudo usermod -aG docker github
```

* 临时切换到 `github` 用户：

```bash
sudo su - github
```

* 进入 `github` 用户的主目录：

```bash
cd
```

* [按照官方指南安装 GitHub Action 自托管运行器](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners#adding-a-self-hosted-runner-to-a-repository)。

* 当被问及标签时，为环境添加一个标签，例如 `production`。您也可以稍后添加标签。

安装后，指南会告诉您运行一个命令来启动运行器。但是，一旦您终止该进程或与服务器失去本地连接，它就会停止。

为了确保它在启动时运行并继续运行，您可以将其安装为服务。为此，退出 `github` 用户并返回 `root` 用户：

```bash
exit
```

完成后，您将再次成为之前的用户。您将处于属于该用户的上一个目录中。

在进入 `github` 用户目录之前，您需要成为 `root` 用户（您可能已经是）：

```bash
sudo su
```

* 作为 `root` 用户，进入 `github` 用户主目录内的 `actions-runner` 目录：

```bash
cd /home/github/actions-runner
```

* 使用用户 `github` 将自托管运行器安装为服务：

```bash
./svc.sh install github
```

* 启动服务：

```bash
./svc.sh start
```

* 检查服务状态：

```bash
./svc.sh status
```

您可以在官方指南中阅读更多相关信息：[将自托管运行器应用程序配置为服务](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service)。

### 设置密钥

在您的存储库中，为您需要的环境变量配置密钥，与上面描述的相同，包括 `SECRET_KEY` 等。请遵循[用于设置存储库密钥的官方 GitHub 指南](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository)。

当前的 Github Actions 工作流程期望这些密钥：

* `DOMAIN_PRODUCTION`
* `DOMAIN_STAGING`
* `STACK_NAME_PRODUCTION`
* `STACK_NAME_STAGING`
* `EMAILS_FROM_EMAIL`
* `FIRST_SUPERUSER`
* `FIRST_SUPERUSER_PASSWORD`
* `POSTGRES_PASSWORD`
* `SECRET_KEY`
* `LATEST_CHANGES`
* `SMOKESHOW_AUTH_KEY`

## GitHub Action 部署工作流程

在 `.github/workflows` 目录中已经有 GitHub Action 工作流程，用于部署到环境（带有标签的 GitHub Actions 运行器）：

* `staging`：在推送到（或合并到）`master` 分支之后。
* `production`：在发布版本之后。

如果您需要添加额外的环境，您可以使用这些作为起点。

## URL

将 `fastapi-project.example.com` 替换为您的域名。

### 主 Traefik 仪表板

Traefik UI：`https://traefik.fastapi-project.example.com`

### 生产环境

前端：`https://dashboard.fastapi-project.example.com`

后端 API 文档：`https://api.fastapi-project.example.com/docs`

后端 API 基础 URL：`https://api.fastapi-project.example.com`

Adminer：`https://adminer.fastapi-project.example.com`

### Staging 环境

前端：`https://dashboard.staging.fastapi-project.example.com`

后端 API 文档：`https://api.staging.fastapi-project.example.com/docs`

后端 API 基础 URL：`https://api.staging.fastapi-project.example.com`

Adminer：`https://adminer.staging.fastapi-project.example.com`
