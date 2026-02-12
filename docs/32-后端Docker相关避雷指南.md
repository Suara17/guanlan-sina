
---

## Docker相关避雷指南

### ⚠️ 常见陷阱

#### 1. 代码修改未生效

**现象**：
- 本地文件已修改
- 容器内代码仍是旧版本
- 重启容器无效

**原因**：
Docker 镜像在构建时将代码复制到镜像中，容器运行的是镜像内的代码副本，不是主机代码。

**解决方案**：

##### 方案A：重新构建镜像（推荐）
```bash
cd E:\Guanlan-Sina

# 1. 停止容器
docker compose stop backend

# 2. 删除旧镜像
docker rmi guanlan-sina-backend:latest

# 3. 清除构建缓存（可选）
docker builder prune -f

# 4. 重新构建
docker compose build backend

# 5. 启动容器
docker compose up -d backend
```

##### 方案B：使用 docker cp（临时方案）
```bash
# 将修改后的文件复制到容器
docker cp "E:/Guanlan-Sina/backend/app/api/routes/tianchou.py" \
  guanlan-sina-backend-1:/app/app/api/routes/tianchou.py

# 重启容器
docker restart guanlan-sina-backend-1
```

⚠️ **注意**：方案B只是临时修复，容器重建后会丢失。

##### 方案C：使用 Volume 挂载（开发环境）
在 `docker-compose.override.yml` 中配置：
```yaml
services:
  backend:
    develop:
      watch:
        - path: ./backend
          action: sync
          target: /app
          ignore:
            - ./backend/.venv
```

#### 2. 构建缓存问题

**现象**：
```
#10 [stage-0 7/9] COPY ./app /app/app
#10 CACHED  # ⚠️ 使用了缓存，没有复制新代码
```

**原因**：
Docker 使用层缓存优化构建速度，但可能导致代码更新未被检测到。

**解决方案**：

```bash
# 方法1：清除所有构建缓存
docker builder prune -f

# 方法2：使用 --no-cache 构建
docker compose build --no-cache backend

# 方法3：修改文件时间戳强制重新复制
touch backend/app/api/routes/tianchou.py
```

#### 3. 网络问题导致构建失败

**现象**：
```
error: Failed to fetch: `https://pypi.org/simple/websockets/`
  Caused by: peer closed connection without sending TLS close_notify
```

**原因**：
- 网络不稳定
- PyPI 镜像源问题
- Docker 构建时的网络限制

**解决方案**：

```bash
# 方法1：重试构建（通常能解决）
docker compose build backend

# 方法2：使用国内镜像源
# 在 backend/Dockerfile 中添加：
ENV UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple

# 方法3：使用已有镜像 + docker cp
# 见"方案B：使用 docker cp"
```

#### 4. 容器内修改验证

**检查容器内代码是否已更新**：
```bash
# 查看特定代码行
docker exec guanlan-sina-backend-1 sh -c \
  "grep -A 3 'device_sizes' /app/app/api/routes/tianchou.py | head -5"

# 查看文件修改时间
docker exec guanlan-sina-backend-1 ls -lh /app/app/api/routes/tianchou.py

# 进入容器查看
docker exec -it guanlan-sina-backend-1 sh
cat /app/app/api/routes/tianchou.py
```

---

## 验证步骤

### 1. 验证代码修复

```bash
# 检查主机代码
grep -A 3 "device_sizes" E:\Guanlan-Sina\backend\app\api\routes\tianchou.py

# 应该看到：
# 'device_sizes': np.array(api_params.get('device_sizes', ...
```

### 2. 验证容器代码

```bash
# 检查容器内代码
docker exec guanlan-sina-backend-1 sh -c \
  "grep -A 3 'device_sizes' /app/app/api/routes/tianchou.py"

# 应该看到相同的 np.array() 包装
```

### 3. 验证后端健康

```bash
# 健康检查
curl http://localhost:8000/api/v1/utils/health-check/
# 应返回: true
```

### 4. 验证功能

```bash
# 创建测试任务
curl -X POST http://localhost:8000/api/v1/tianchou/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试任务",
    "industry_type": "light",
    "workshop_length": 80.0,
    "workshop_width": 60.0,
    "device_count": 10,
    "daily_output_value": 20000,
    "base_cost": 20000,
    "construction_rate": 3000,
    "benefit_multiplier": 200
  }'

# 获取任务ID，然后查询状态
curl http://localhost:8000/api/v1/tianchou/tasks/{task_id}

# 应该看到 status: "completed"
```

### 5. 验证结果

```bash
# 获取方案列表
curl http://localhost:8000/api/v1/tianchou/tasks/{task_id}/solutions

# 应该返回 20 个帕累托最优解
```

---

### 2. Docker 开发流程

**教训**：Docker 容器内的代码不会自动更新。

**最佳实践**：

| 环境 | 推荐方案 | 优点 | 缺点 |
|-----|---------|------|------|
| 开发 | Volume 挂载 + watch | 代码实时同步 | 需要配置 |
| 测试 | 重新构建镜像 | 环境一致性 | 构建耗时 |
| 生产 | CI/CD 自动构建 | 可追溯、可回滚 | 需要基础设施 |

### 3. 调试策略

**教训**：容器化环境的调试需要特殊技巧。

**调试清单**：
1. ✅ 查看容器日志：`docker logs guanlan-sina-backend-1`
2. ✅ 进入容器检查：`docker exec -it guanlan-sina-backend-1 sh`
3. ✅ 验证代码版本：检查文件内容和修改时间
4. ✅ 测试 API 端点：使用 curl 或 Postman
5. ✅ 检查环境变量：`docker exec guanlan-sina-backend-1 env`

### 4. 版本控制

**教训**：修复应该立即提交到版本控制。

**最佳实践**：
```bash
# 1. 修复代码
# 2. 测试验证
# 3. 立即提交
git add backend/app/api/routes/tianchou.py
git commit -m "fix: 修复天筹算法参数类型错误"

# 4. 更新文档
git add docs/32-天筹算法集成-错误修复指南.md
git commit -m "docs: 添加天筹算法错误修复指南"
```

### 5. 文档化

**教训**：复杂的修复过程应该文档化，避免重复踩坑。

**文档清单**：
- ✅ 错误现象和日志
- ✅ 根本原因分析
- ✅ 修复方案和代码
- ✅ Docker 相关注意事项
- ✅ 验证步骤
- ✅ 经验教训

---

## 快速参考

### 常用命令

```bash
# 查看容器状态
docker ps --filter "name=backend"

# 查看容器日志
docker logs -f guanlan-sina-backend-1

# 重启容器
docker restart guanlan-sina-backend-1

# 重新构建并启动
docker compose up -d --build backend

# 进入容器
docker exec -it guanlan-sina-backend-1 sh

# 复制文件到容器
docker cp "local/path/file.py" container:/app/path/file.py

# 清除构建缓存
docker builder prune -f

# 查看镜像
docker images | grep backend
```

### 测试 API

```bash
# 健康检查
curl http://localhost:8000/api/v1/utils/health-check/

# 创建任务
curl -X POST http://localhost:8000/api/v1/tianchou/tasks \
  -H "Content-Type: application/json" \
  -d @test_request.json

# 查询任务状态
curl http://localhost:8000/api/v1/tianchou/tasks/{task_id}

# 获取方案列表
curl http://localhost:8000/api/v1/tianchou/tasks/{task_id}/solutions
```

---

## 更新日志

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2026-02-12 | 1.0 | 初始版本，记录天筹算法类型错误修复过程 | Claude |


