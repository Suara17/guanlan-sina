# FastAPI 项目 - 后端

## 要求

* [Docker](https://www.docker.com/)。
* [uv](https://docs.astral.sh/uv/) 用于 Python 包和环境管理。

## Docker Compose

按照 [../development.md](../development.md) 中的指南使用 Docker Compose 启动本地开发环境。

## 一般工作流程

默认情况下，依赖项使用 [uv](https://docs.astral.sh/uv/) 管理，请前往那里并安装它。

从 `./backend/` 您可以使用以下命令安装所有依赖项：

```console
$ uv sync
```

然后您可以使用以下命令激活虚拟环境：

```console
$ source .venv/bin/activate
```

确保您的编辑器使用正确的 Python 虚拟环境，解释器位于 `backend/.venv/bin/python`。

在 `./backend/app/models.py` 中修改或添加数据和 SQL 表的 SQLModel 模型，在 `./backend/app/api/` 中添加 API 端点，在 `./backend/app/crud.py` 中添加 CRUD（创建、读取、更新、删除）工具。

## VS Code

已经有配置可以通过 VS Code 调试器运行后端，以便您可以使用断点、暂停和探索变量等。

该设置也已配置，以便您可以通过 VS Code Python 测试选项卡运行测试。

## Docker Compose Override

在开发期间，您可以更改 Docker Compose 设置，这些设置只会影响文件 `docker-compose.override.yml` 中的本地开发环境。

对该文件的更改只影响本地开发环境，而不影响生产环境。因此，您可以添加有助于开发工作流程的"临时"更改。

例如，包含后端代码的目录在 Docker 容器中同步，将您更改的代码实时复制到容器内的目录中。这允许您立即测试您的更改，而无需再次构建 Docker 镜像。这应该只在开发期间完成，对于生产环境，您应该使用最新版本的后端代码构建 Docker 镜像。但在开发期间，它允许您非常快速地迭代。

还有一个命令覆盖，运行 `fastapi run --reload` 而不是默认的 `fastapi run`。它启动单个服务器进程（而不是多个，就像生产环境那样），并在代码更改时重新加载进程。请记住，如果您有语法错误并保存 Python 文件，它将中断并退出，容器将停止。之后，您可以通过修复错误并再次运行来重新启动容器：

```console
$ docker compose watch
```

还有一个注释掉的 `command` 覆盖，您可以取消注释并注释默认的那个。它使后端容器运行一个"什么都不做"的进程，但保持容器存活。这允许您进入正在运行的容器并在其中执行命令，例如 Python 解释器来测试已安装的依赖项，或者启动在检测到更改时重新加载的开发服务器。

要使用 `bash` 会话进入容器，您可以使用以下命令启动堆栈：

```console
$ docker compose watch
```

然后在另一个终端中，`exec` 进入正在运行的容器：

```console
$ docker compose exec backend bash
```

您应该看到类似以下的输出：

```console
root@7f2607af31c3:/app#
```

这意味着您在容器内的 `bash` 会话中，作为 `root` 用户，在 `/app` 目录下，这个目录里面有另一个名为 "app" 的目录，这就是您的代码在容器内的位置：`/app/app`。

在那里，您可以使用 `fastapi run --reload` 命令运行调试实时重新加载服务器。

```console
$ fastapi run --reload app/main.py
```

...它看起来像：

```console
root@7f2607af31c3:/app# fastapi run --reload app/main.py
```

然后按 Enter 键。这运行实时重新加载服务器，在检测到代码更改时自动重新加载。

但是，如果它没有检测到更改但有语法错误，它只会因错误而停止。但由于容器仍然存活并且您在 Bash 会话中，您可以在修复错误后快速重新启动它，运行相同的命令（"向上箭头"和"Enter"）。

...前面的细节就是让容器什么都不做地存活，然后在 Bash 会话中让它运行实时重新加载服务器的原因。

## 后端测试

要测试后端，请运行：

```console
$ bash ./scripts/test.sh
```

测试使用 Pytest 运行，在 `./backend/tests/` 中修改和添加测试。

如果您使用 GitHub Actions，测试将自动运行。

### 测试运行堆栈

如果您的堆栈已经启动，您只想运行测试，您可以使用：

```bash
docker compose exec backend bash scripts/tests-start.sh
```

该 `/app/scripts/tests-start.sh` 脚本只是在确保堆栈的其余部分正在运行之后调用 `pytest`。如果您需要将额外的参数传递给 `pytest`，您可以将它们传递给该命令，它们将被转发。

例如，要在第一个错误时停止：

```bash
docker compose exec backend bash scripts/tests-start.sh -x
```

### 测试覆盖率

运行测试时，会生成一个文件 `htmlcov/index.html`，您可以在浏览器中打开它以查看测试的覆盖率。

## 迁移

由于在本地开发期间，您的应用目录作为卷挂载在容器内，您也可以在容器内使用 `alembic` 命令运行迁移，迁移代码将在您的应用目录中（而不仅仅是在容器内）。因此，您可以将其添加到您的 git 存储库中。

确保您为模型创建一个"修订"，并且每次更改它们时都使用该修订"升级"您的数据库。因为这将更新数据库中的表。否则，您的应用程序将出现错误。

* 在后端容器中启动交互式会话：

```console
$ docker compose exec backend bash
```

* Alembic 已配置为从 `./backend/app/models.py` 导入您的 SQLModel 模型。

* 更改模型后（例如，添加一列），在容器内，创建一个修订，例如：

```console
$ alembic revision --autogenerate -m "Add column last_name to User model"
```

* 将在 alembic 目录中生成的文件提交到 git 存储库。

* 创建修订后，在数据库中运行迁移（这是实际更改数据库的内容）：

```console
$ alembic upgrade head
```

如果您根本不想使用迁移，请取消注释 `./backend/app/core/db.py` 中以以下内容结尾的行：

```python
SQLModel.metadata.create_all(engine)
```

并注释 `scripts/prestart.sh` 文件中包含以下内容的行：

```console
$ alembic upgrade head
```

如果您不想从默认模型开始，并且从一开始就想删除/修改它们，而没有任何先前的修订，您可以删除 `./backend/app/alembic/versions/` 下的修订文件（`.py` Python 文件）。然后如上所述创建第一个迁移。

## 电子邮件模板

电子邮件模板位于 `./backend/app/email-templates/`。这里有两个目录：`build` 和 `src`。`src` 目录包含用于构建最终电子邮件模板的源文件。`build` 目录包含应用程序使用的最终电子邮件模板。

在继续之前，确保您在 VS Code 中安装了 [MJML 扩展](https://marketplace.visualstudio.com/items?itemName=attilabuti.vscode-mjml)。

安装 MJML 扩展后，您可以在 `src` 目录中创建一个新的电子邮件模板。创建新的电子邮件模板后，并在编辑器中打开 `.mjml` 文件，使用 `Ctrl+Shift+P` 打开命令面板并搜索 `MJML: Export to HTML`。这将把 `.mjml` 文件转换为 `.html` 文件，现在您可以将它保存在 build 目录中。
