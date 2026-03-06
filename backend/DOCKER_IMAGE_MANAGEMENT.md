# Docker 镜像管理指南

## 📋 目录

- [镜像保护策略](#镜像保护策略)
- [版本管理](#版本管理)
- [安全清理](#安全清理)
- [常见问题](#常见问题)

## 🛡️ 镜像保护策略

### 为什么需要保护镜像?

1. **避免意外删除**: `docker system prune -a` 会删除所有未使用的镜像
2. **版本回退**: 保留历史版本便于快速回滚
3. **构建缓存**: 避免重复构建大型镜像(节省时间和带宽)

### 当前镜像状态

```bash
# 查看项目镜像
docker images | grep guanlan-sina
```

当前已创建的标签:
- `guanlan-sina-backend:latest` - 最新构建(会被覆盖)
- `guanlan-sina-backend:v1.0.0` - 锁定版本
- `guanlan-sina-prestart:latest` - 最新构建(会被覆盖)
- `guanlan-sina-prestart:v1.0.0` - 锁定版本

## 🏷️ 版本管理

### 1. 手动添加版本标签

```bash
# 为当前镜像添加版本标签
docker tag guanlan-sina-backend:latest guanlan-sina-backend:v1.0.1
docker tag guanlan-sina-prestart:latest guanlan-sina-prestart:v1.0.1
```

### 2. 使用自动化脚本(推荐)

#### Windows:
```cmd
# 使用默认时间戳版本
.\scripts\protect-images.bat

# 使用自定义版本号
.\scripts\protect-images.bat v1.0.2
```

#### Linux/Mac:
```bash
# 使用默认时间戳版本
./scripts/protect-images.sh

# 使用自定义版本号
./scripts/protect-images.sh v1.0.2
```

### 3. 版本命名规范

建议使用语义化版本控制(Semantic Versioning):

- `v1.0.0` - 主版本.次版本.修订号
- `v1.0.0-alpha` - 预发布版本
- `v1.0.0-beta.1` - Beta 版本
- `stable` - 稳定版本标记
- `v20260122-1730` - 时间戳版本

示例:
```bash
# 新功能发布
docker tag guanlan-sina-backend:latest guanlan-sina-backend:v1.1.0

# Bug 修复
docker tag guanlan-sina-backend:latest guanlan-sina-backend:v1.0.1

# 重大更新
docker tag guanlan-sina-backend:latest guanlan-sina-backend:v2.0.0

# 标记稳定版
docker tag guanlan-sina-backend:v1.0.0 guanlan-sina-backend:stable
```

## 🧹 安全清理

### 方法一: 使用安全清理脚本(推荐)

```cmd
# Windows
.\scripts\clean-docker-safe.bat
```

这个脚本只会清理:
- ✅ 停止的容器
- ✅ 未使用的网络
- ✅ 悬空镜像(dangling images)
- ❌ **不会**删除任何带标签的镜像

### 方法二: 手动选择性清理

```bash
# 1. 清理停止的容器
docker container prune -f

# 2. 清理未使用的网络
docker network prune -f

# 3. 清理悬空镜像(没有标签的镜像)
docker image prune -f

# 4. 清理未使用的数据卷
docker volume prune -f
```

### ⚠️ 危险操作(谨慎使用)

```bash
# 删除所有未使用的镜像(包括带标签但未被容器使用的)
docker image prune -a -f

# 删除所有内容(容器、镜像、网络、数据卷)
docker system prune -a --volumes -f
```

**警告**: 上述命令会删除所有未运行的镜像,即使它们有标签!

## 🔄 镜像回滚

### 场景: 新版本有问题,需要回退到旧版本

1. **查看可用版本**:
```bash
docker images | grep guanlan-sina-backend
```

2. **停止当前服务**:
```bash
docker compose down
```

3. **修改 docker-compose.yml 使用特定版本**:
```yaml
services:
  backend:
    image: guanlan-sina-backend:v1.0.0  # 指定旧版本
    # 或者手动标记旧版本为 latest:
    # docker tag guanlan-sina-backend:v1.0.0 guanlan-sina-backend:latest
```

4. **重新启动服务**:
```bash
docker compose up -d
```

## 📦 镜像备份与恢复

### 导出镜像到文件

```bash
# 导出单个镜像
docker save guanlan-sina-backend:v1.0.0 -o backend-v1.0.0.tar

# 导出多个镜像
docker save guanlan-sina-backend:v1.0.0 guanlan-sina-prestart:v1.0.0 -o guanlan-sina-v1.0.0.tar

# 压缩导出(节省空间)
docker save guanlan-sina-backend:v1.0.0 | gzip > backend-v1.0.0.tar.gz
```

### 从文件导入镜像

```bash
# 导入镜像
docker load -i backend-v1.0.0.tar

# 导入压缩镜像
gunzip -c backend-v1.0.0.tar.gz | docker load
```

## 🔍 镜像信息查看

```bash
# 查看镜像详细信息
docker inspect guanlan-sina-backend:v1.0.0

# 查看镜像历史(构建层)
docker history guanlan-sina-backend:v1.0.0

# 查看镜像大小
docker images guanlan-sina-backend:v1.0.0

# 查看所有版本及大小
docker images guanlan-sina-backend
```

## 🗑️ 删除特定镜像

```bash
# 删除指定版本
docker rmi guanlan-sina-backend:v1.0.0

# 强制删除(即使有容器使用)
docker rmi -f guanlan-sina-backend:v1.0.0

# 删除所有旧版本(保留 latest 和 stable)
docker images guanlan-sina-backend --format "{{.Tag}}" | grep -v -E "latest|stable" | xargs -I {} docker rmi guanlan-sina-backend:{}
```

## 💡 最佳实践

### 1. 构建新镜像时自动打标签

在 CI/CD 流程中:
```bash
# 构建镜像
docker compose build

# 立即添加版本标签
VERSION=$(git describe --tags --always)
docker tag guanlan-sina-backend:latest guanlan-sina-backend:$VERSION
```

### 2. 定期清理(每周/每月)

```bash
# 安全清理脚本
.\scripts\clean-docker-safe.bat

# 查看清理效果
docker system df
```

### 3. 保留策略建议

- **latest**: 始终保持最新构建
- **stable**: 当前生产环境使用的版本
- **v*.*.*** : 保留最近 3-5 个版本
- **时间戳版本**: 保留最近 7 天的每日构建

### 4. 磁盘空间监控

```bash
# 查看 Docker 磁盘使用情况
docker system df

# 详细查看各类资源占用
docker system df -v
```

## 🚨 常见问题

### Q1: 为什么执行 `docker compose build` 后旧镜像还在?

**A**: Docker 不会自动删除旧镜像。新构建的镜像会覆盖 `latest` 标签,但旧镜像会变成 `<none>` (悬空镜像)。

解决方案:
```bash
# 清理悬空镜像
docker image prune -f
```

### Q2: 如何找回被删除的镜像?

**A**: 如果镜像被删除且没有备份,只能重新构建:

```bash
# 重新构建
docker compose build --no-cache

# 从备份恢复
docker load -i backup.tar
```

### Q3: 镜像占用空间太大怎么办?

**A**: 优化策略:

1. 使用 `.dockerignore` 排除不必要的文件
2. 使用多阶段构建减小镜像体积
3. 定期清理未使用的镜像
4. 考虑使用更小的基础镜像(如 alpine)

### Q4: 如何确保镜像不被 `docker system prune -a` 删除?

**A**:

1. 保持镜像被容器使用(运行中或停止状态)
2. 使用明确的版本标签
3. 定期导出重要镜像到文件
4. 使用本文档提供的安全清理脚本

## 📚 相关命令速查

```bash
# 镜像管理
docker images                          # 列出所有镜像
docker tag SOURCE TARGET               # 添加标签
docker rmi IMAGE                       # 删除镜像
docker save IMAGE -o FILE              # 导出镜像
docker load -i FILE                    # 导入镜像

# 清理命令
docker image prune                     # 清理悬空镜像
docker image prune -a                  # 清理未使用镜像
docker system prune                    # 清理所有未使用资源
docker system df                       # 查看磁盘使用

# 查看信息
docker inspect IMAGE                   # 查看镜像详情
docker history IMAGE                   # 查看镜像历史
```

## 🔗 相关文档

- [Docker 官方文档 - 镜像管理](https://docs.docker.com/engine/reference/commandline/image/)
- [语义化版本控制](https://semver.org/lang/zh-CN/)
- [项目启动指南](./07-启动指南.md)

---

**最后更新**: 2026-01-22
**维护者**: 弈控经纬开发团队
