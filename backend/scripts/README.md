# Scripts 目录说明

本目录包含项目开发、测试和部署的辅助脚本。

## 目录结构

```
scripts/
├── format.sh       # 代码格式化脚本
├── lint.sh         # 代码检查脚本
├── prestart.sh     # 应用启动前准备脚本
├── test.sh         # 运行测试脚本
└── tests-start.sh  # 启动测试环境脚本
```

## 脚本说明

### format.sh
代码格式化脚本，用于统一代码风格：

**功能：**
- 使用 Ruff 格式化 Python 代码
- 自动修复格式问题

**使用方法：**
```bash
./scripts/format.sh
```

**或直接使用 Ruff：**
```bash
ruff format .
```

### lint.sh
代码检查脚本，用于发现代码问题：

**功能：**
- 使用 Ruff 进行代码检查
- 检查代码质量、潜在错误、代码风格等

**使用方法：**
```bash
./scripts/lint.sh
```

**或直接使用 Ruff：**
```bash
ruff check .
```

### prestart.sh
应用启动前准备脚本：

**功能：**
- 运行数据库迁移
- 初始化数据
- 检查依赖
- 验证配置

**使用方法：**
```bash
./scripts/prestart.sh
```

**或直接运行：**
```bash
python app/backend_pre_start.py
```

### test.sh
运行测试脚本：

**功能：**
- 运行所有测试
- 生成测试覆盖率报告
- 显示测试结果

**使用方法：**
```bash
./scripts/test.sh
```

**或直接使用 pytest：**
```bash
pytest --cov=app --cov-report=html
```

### tests-start.sh
启动测试环境脚本：

**功能：**
- 准备测试数据库
- 运行测试前初始化
- 配置测试环境

**使用方法：**
```bash
./scripts/tests-start.sh
```

**或直接运行：**
```bash
python app/tests_pre_start.py
```

## Windows 兼容性

⚠️ **注意：** 这些脚本是为 Unix/Linux 系统设计的。在 Windows 上使用时：

**选项 1：使用 Git Bash**
```bash
./scripts/format.sh
```

**选项 2：使用 PowerShell**
```powershell
# 格式化代码
ruff format .

# 检查代码
ruff check .

# 运行测试
pytest --cov=app --cov-report=html

# 启动前准备
python app/backend_pre_start.py
```

**选项 3：使用 WSL**
```bash
./scripts/format.sh
```

## 代码质量工具

本项目使用以下工具保证代码质量：

### Ruff
- **功能：** 快速的 Python 代码检查和格式化工具
- **配置：** `pyproject.toml`
- **优势：** 比 flake8 和 black 更快，功能更全面

### pytest
- **功能：** Python 测试框架
- **配置：** `pyproject.toml`
- **优势：** 简单易用，插件丰富

### pytest-cov
- **功能：** 测试覆盖率工具
- **配置：** `pyproject.toml`
- **优势：** 生成详细的覆盖率报告

### mypy
- **功能：** 静态类型检查
- **配置：** `pyproject.toml`
- **优势：** 在运行前发现类型错误

## 开发工作流

推荐的开发工作流：

1. **编写代码**
2. **格式化代码**
   ```bash
   ./scripts/format.sh
   ```
3. **检查代码**
   ```bash
   ./scripts/lint.sh
   ```
4. **运行测试**
   ```bash
   ./scripts/test.sh
   ```
5. **提交代码**

## CI/CD 集成

这些脚本会在 CI/CD 流程中自动执行：
- 代码格式化检查
- 代码质量检查
- 测试运行
- 覆盖率报告生成

## 自定义脚本

如需添加新的脚本：

1. 在 `scripts/` 目录创建脚本文件
2. 添加执行权限（Unix/Linux）
   ```bash
   chmod +x scripts/your_script.sh
   ```
3. 在脚本开头添加 shebang
   ```bash
   #!/usr/bin/env bash
   ```
4. 编写脚本内容
5. 在 README 中添加说明

## 注意事项

⚠️ **重要：**
1. Windows 用户建议使用 PowerShell 或 Git Bash
2. 确保脚本有执行权限（Unix/Linux）
3. 在运行脚本前确保虚拟环境已激活
4. 定期更新依赖项以保持工具最新
5. 遇到问题时，可直接使用工具命令而非脚本
