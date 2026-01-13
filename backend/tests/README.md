# Tests 目录说明

本目录包含后端应用程序的测试代码，使用 pytest 测试框架。

## 目录结构

```
tests/
├── api/                    # API 接口测试
│   ├── test_items.py       # 物品接口测试
│   ├── test_login.py       # 登录接口测试
│   ├── test_private.py     # 私有接口测试
│   ├── test_production.py  # 生产管理接口测试
│   └── test_users.py       # 用户接口测试
├── crud/                   # CRUD 操作测试
│   └── test_user.py        # 用户 CRUD 测试
├── scripts/                # 脚本测试
│   ├── test_backend_pre_start.py   # 后端启动脚本测试
│   └── test_test_pre_start.py      # 测试启动脚本测试
├── utils/                  # 工具函数测试
│   ├── item.py             # 物品工具测试
│   ├── user.py             # 用户工具测试
│   └── utils.py            # 通用工具测试
├── __init__.py
└── conftest.py             # pytest 配置和 fixtures
```

## 测试模块说明

### conftest.py
pytest 配置文件，定义：
- 数据库测试 fixture
- 测试客户端 fixture
- 用户认证 fixture
- 其他共享测试工具

### api/
API 接口测试模块：
- **test_login.py** - 测试登录、Token 获取和刷新
- **test_users.py** - 测试用户注册、查询、更新
- **test_items.py** - 测试物品 CRUD 操作
- **test_production.py** - 测试生产管理接口
- **test_private.py** - 测试私有接口（仅本地环境）

### crud/
CRUD 操作测试模块：
- **test_user.py** - 测试用户数据库操作

### scripts/
脚本测试模块：
- **test_backend_pre_start.py** - 测试后端启动前脚本
- **test_test_pre_start.py** - 测试测试启动前脚本

### utils/
工具函数测试模块：
- **item.py** - 测试物品相关工具函数
- **user.py** - 测试用户相关工具函数
- **utils.py** - 测试通用工具函数

## 运行测试

### 运行所有测试
```bash
pytest
```

### 运行特定测试文件
```bash
pytest tests/api/test_users.py
```

### 运行特定测试函数
```bash
pytest tests/api/test_users.py::test_create_user
```

### 运行特定目录的测试
```bash
pytest tests/api/
```

### 显示详细输出
```bash
pytest -v
```

### 显示打印输出
```bash
pytest -s
```

### 生成覆盖率报告
```bash
pytest --cov=app --cov-report=html
```

### 停止在第一个失败
```bash
pytest -x
```

## 测试配置

测试配置在项目根目录的 `pyproject.toml` 中：
- pytest 插件配置
- 测试覆盖率配置
- 测试路径配置

## 测试数据库

测试使用独立的测试数据库，不会影响生产数据：
- 测试数据库配置在 `conftest.py` 中
- 每次测试前自动创建数据库
- 测试后自动清理数据

## Fixtures

常用的测试 fixtures：

```python
# 测试客户端
client -> TestClient

# 数据库会话
db -> Session

# 测试用户
user -> User

# 超级管理员
superuser -> User

# 用户 Token
user_token -> str

# 超级管理员 Token
superuser_token -> str
```

## 测试最佳实践

1. **独立性** - 每个测试应该独立运行，不依赖其他测试
2. **可重复性** - 测试结果应该可以重复，不受外部因素影响
3. **快速** - 测试应该快速执行，避免不必要的等待
4. **清晰** - 测试名称应该清晰描述测试内容
5. **覆盖率** - 保持高测试覆盖率，目标 >80%
6. **边界测试** - 测试正常情况和边界情况
7. **异常测试** - 测试错误处理和异常情况

## 编写测试

### API 测试示例
```python
def test_create_user(client: TestClient):
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
```

### CRUD 测试示例
```python
def test_create_user(db: Session):
    user_in = UserCreate(
        email="test@example.com",
        username="testuser",
        password="testpass123"
    )
    user = create_user(session=db, user_create=user_in)
    assert user.email == "test@example.com"
```

## 持续集成

测试会在以下情况自动运行：
- 代码提交前（通过 pre-commit hook）
- Pull Request 创建时
- 合并到主分支时

## 注意事项

⚠️ **重要：**
1. 不要在测试中使用生产数据库
2. 测试数据应该在测试后清理
3. 避免使用硬编码的测试数据
4. 使用 fixture 复用测试代码
5. 保持测试代码的简洁和可读性
6. 定期检查测试覆盖率
