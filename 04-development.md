# FastAPI 项目 - 开发

## Docker Compose

* 使用 Docker Compose 启动本地堆栈：

```bash
docker compose watch
```

* 现在您可以打开浏览器并与这些 URL 交互：

前端，使用 Docker 构建，根据路径处理路由：<http://localhost:5173>

后端，基于 OpenAPI 的基于 JSON 的 Web API：<http://localhost:8000>

使用 Swagger UI 的自动交互式文档（来自 OpenAPI 后端）：<http://localhost:8000/docs>

Adminer，数据库 Web 管理：<http://localhost:8080>

Traefik UI，用于查看代理如何处理路由：<http://localhost:8090>

**注意**：第一次启动堆栈时，可能需要一分钟才能准备好。当后端等待数据库准备就绪并配置所有内容时。您可以检查日志来监控它。

要检查日志，请运行（在另一个终端中）：

```bash
docker compose logs
```

要检查特定服务的日志，请添加服务的名称，例如：

```bash
docker compose logs backend
```

## Mailcatcher

Mailcatcher 是一个简单的 SMTP 服务器，它捕获后端在本地开发期间发送的所有电子邮件。而不是发送真实的电子邮件，它们被捕获并显示在 Web 界面中。

这对于以下情况很有用：

* 在开发期间测试电子邮件功能
* 验证电子邮件内容和格式
* 在不发送真实电子邮件的情况下调试与电子邮件相关的功能

后端在本地使用 Docker Compose 运行时自动配置为使用 Mailcatcher（端口 1025 上的 SMTP）。所有捕获的电子邮件都可以在 <http://localhost:1080> 查看。

## 本地开发

Docker Compose 文件已配置，以便每个服务在 `localhost` 的不同端口上可用。

对于后端和前端，它们使用与本地开发服务器相同的端口，因此，后端位于 `http://localhost:8000`，前端位于 `http://localhost:5173`。

这样，您可以关闭 Docker Compose 服务并启动其本地开发服务，一切都将继续工作，因为它们都使用相同的端口。

例如，您可以在 Docker Compose 中停止 `frontend` 服务，在另一个终端中，运行：

```bash
docker compose stop frontend
```

然后启动本地前端开发服务器：

```bash
cd frontend
npm run dev
```

或者您可以停止 `backend` Docker Compose 服务：

```bash
docker compose stop backend
```

然后您可以运行后端的本地开发服务器：

```bash
cd backend
fastapi dev app/main.py
```

## `localhost.tiangolo.com` 中的 Docker Compose

当您启动 Docker Compose 堆栈时，默认情况下它使用 `localhost`，每个服务使用不同的端口（后端、前端、adminer 等）。

当您将其部署到生产环境（或 staging）时，它将在不同的子域中部署每个服务，例如后端使用 `api.example.com`，前端使用 `dashboard.example.com`。

在关于[部署](deployment.md)的指南中，您可以阅读有关 Traefik 的信息，即已配置的代理。这是负责根据子域将流量传输到每个服务的组件。

如果您想在本地测试它是否都在工作，您可以编辑本地 `.env` 文件，并更改：

```dotenv
DOMAIN=localhost.tiangolo.com
```

这将由 Docker Compose 文件用于配置服务的基本域名。

Traefik 将使用它将 `api.localhost.tiangolo.com` 的流量传输到后端，将 `dashboard.localhost.tiangolo.com` 的流量传输到前端。

域名 `localhost.tiangolo.com` 是一个特殊域名，已配置（及其所有子域名）指向 `127.0.0.1`。这样您就可以在本地开发中使用它。

更新后，再次运行：

```bash
docker compose watch
```

部署时，例如在生产环境中，主要的 Traefik 在 Docker Compose 文件之外配置。对于本地开发，`docker-compose.override.yml` 中包含一个 Traefik，只是为了让您测试域名是否按预期工作，例如使用 `api.localhost.tiangolo.com` 和 `dashboard.localhost.tiangolo.com`。

## Docker Compose 文件和环境变量

有一个主要的 `docker-compose.yml` 文件，其中包含适用于整个堆栈的所有配置，它由 `docker compose` 自动使用。

还有一个 `docker-compose.override.yml` 文件，其中包含开发的覆盖配置，例如将源代码作为卷挂载。它由 `docker compose` 自动使用，以便在 `docker-compose.yml` 之上应用覆盖。

这些 Docker Compose 文件使用 `.env` 文件，其中包含要作为环境变量注入到容器中的配置。

它们还使用一些在调用 `docker compose` 命令之前在脚本中设置的环境变量的额外配置。

更改变量后，确保重新启动堆栈：

```bash
docker compose watch
```

## .env 文件

`.env` 文件是包含所有配置、生成的密钥和密码等的文件。

根据您的工作流程，您可能希望将其从 Git 中排除，例如，如果您的项目是公开的。在这种情况下，您必须确保为您的 CI 工具设置一种在构建或部署项目时获取它的方法。

一种方法可能是将每个环境变量添加到您的 CI/CD 系统中，并更新 `docker-compose.yml` 文件以读取该特定的环境变量，而不是读取 `.env` 文件。

## 预提交和代码检查

我们使用一个名为 [pre-commit](https://pre-commit.com/) 的工具进行代码检查和格式化。

当您安装它时，它会在 git 中提交之前运行。这样，它可以确保代码是一致的，甚至在提交之前就已格式化。

您可以在项目根目录下找到包含配置的文件 `.pre-commit-config.yaml`。

#### 安装 pre-commit 以自动运行

`pre-commit` 已经是项目依赖项的一部分，但如果您愿意，也可以全局安装它，按照[官方 pre-commit 文档](https://pre-commit.com/)。

在安装并可使用 `pre-commit` 工具后，您需要在本地存储库中"安装"它，以便它在每次提交之前自动运行。

使用 `uv`，您可以这样做：

```bash
❯ uv run pre-commit install
pre-commit installed at .git/hooks/pre-commit
```

现在，每当您尝试提交时，例如使用：

```bash
git commit
```

...pre-commit 将运行并检查和格式化您即将提交的代码，并要求您使用 git 再次添加该代码（暂存它）然后再提交。

然后您可以再次 `git add` 修改/修复的文件，现在您可以提交了。

#### 手动运行预提交挂钩

您还可以在所有文件上手动运行 `pre-commit`，您可以使用 `uv` 来完成：

```bash
❯ uv run pre-commit run --all-files
check for added large files..............................................Passed
check toml...............................................................Passed
check yaml...............................................................Passed
ruff.....................................................................Passed
ruff-format..............................................................Passed
eslint...................................................................Passed
prettier.................................................................Passed
```

## URL

生产环境或 staging URL 将使用这些相同的路径，但使用您自己的域名。

### 开发 URL

开发 URL，用于本地开发。

前端：<http://localhost:5173>

后端：<http://localhost:8000>

自动交互式文档（Swagger UI）：<http://localhost:8000/docs>

自动替代文档（ReDoc）：<http://localhost:8000/redoc>

Adminer：<http://localhost:8080>

Traefik UI：<http://localhost:8090>

MailCatcher：<http://localhost:1080>

### 配置了 `localhost.tiangolo.com` 的开发 URL

开发 URL，用于本地开发。

前端：<http://dashboard.localhost.tiangolo.com>

后端：<http://api.localhost.tiangolo.com>

自动交互式文档（Swagger UI）：<http://api.localhost.tiangolo.com/docs>

自动替代文档（ReDoc）：<http://api.localhost.tiangolo.com/redoc>

Adminer：<http://localhost.tiangolo.com:8080>

Traefik UI：<http://localhost.tiangolo.com:8090>

MailCatcher：<http://localhost.tiangolo.com:1080>
