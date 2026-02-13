# Neo4j 数据迁移指南

本文档记录了如何将Excel数据迁移到Neo4j数据库的过程，适用于数据丢失后重新导入或新环境部署。

## 环境要求

- Docker 和 Docker Compose 已安装并运行
- Neo4j 数据库容器已启动并运行在 `localhost:7687`
- Python 环境已安装 pandas 和 openpyxl 库

## 数据源

### data.xlsx（原始数据）
- 数据文件：`docs/知识图谱/data.xlsx`
- 数据内容：产线类型、异常现象、原因及解决方案等知识图谱数据
- 记录数量：33条原始记录

### data2.xlsx（扩展数据）
- 数据文件：`docs/知识图谱/data2.xlsx`
- 数据内容：产线类型、异常现象、原因及解决方案等知识图谱数据
- 记录数量：160条记录
- 迁移日期：2026-02-12
- 迁移结果：
  - 产线数量: 4 (SMT, PCB, 3C组装, 包装)
  - 异常数量: 30
  - 原因数量: 160
  - 解决方案数量: 320

## 迁移步骤

### 方法一：直接在宿主机运行（推荐）

#### 迁移 data.xlsx
1. **确保Neo4j服务正在运行**
   ```bash
   docker ps
   ```
   确认 `guanlan-sina-neo4j-1` 容器处于运行状态

2. **运行迁移脚本**
   ```bash
   cd E:\Guanlan-Sina
   python temp_neo4j_migration.py
   ```

3. **验证数据迁移**
   ```bash
   python temp_check_neo4j_data.py
   ```

#### 迁移 data2.xlsx
1. **确保Neo4j服务正在运行**
   ```bash
   docker ps
   ```

2. **运行迁移脚本**
   ```bash
   cd E:\Guanlan-Sina
   python temp_neo4j_migration_data2.py
   ```

3. **验证数据迁移**
   ```bash
   python temp_check_neo4j_data2.py
   ```

### 方法二：在Docker容器内运行

1. **进入backend容器**
   ```bash
   docker-compose exec -it backend bash
   ```

2. **安装必要依赖**
   ```bash
   pip install pandas
   ```

3. **运行迁移脚本**
   ```bash
   python -c "
   import sys, pandas as pd
   from pathlib import Path
   project_root = Path('/app')
   sys.path.insert(0, str(project_root))
   
   from app.scripts.migrate_to_neo4j import migrate_excel_to_neo4j
   migrate_excel_to_neo4j()
   "
   ```

## 重要注意事项

1. **连接配置**：
   - 当从宿主机运行脚本时，使用 `bolt://localhost:7687`
   - 当从Docker容器内运行脚本时，使用 `bolt://neo4j:7687`

2. **环境变量问题**：
   - 默认的 `.env` 文件中 `NEO4J_URI=bolt://neo4j:7687`
   - 直接在宿主机运行脚本时需绕过此配置，使用本地连接

3. **依赖项**：
   - 迁移脚本需要 `pandas` 和 `openpyxl` 库
   - 如果容器中缺少这些库，需要先安装

## 迁移后验证

迁移完成后，应验证以下内容：

- 产线数量: 3
- 异常数量: 11
- 原因数量: 33
- 解决方案数量: 66

可通过运行验证脚本检查数据完整性。

## 故障排除

### 常见问题

1. **DNS解析错误** (`Failed to DNS resolve address neo4j:7687`)
   - 原因：尝试从宿主机连接到容器内服务名
   - 解决：使用 `bolt://localhost:7687` 替代 `bolt://neo4j:7687`

2. **模块缺失** (`No module named 'pandas'`)
   - 原因：容器内未安装pandas库
   - 解决：运行 `pip install pandas` 或更新 `pyproject.toml` 并重建容器

3. **连接被拒绝** (`Connection refused`)
   - 原因：Neo4j服务未启动
   - 解决：检查 `docker ps` 确认Neo4j容器正在运行

## 临时脚本说明

本指南中使用的临时脚本：

### data.xlsx 迁移脚本
- `temp_neo4j_migration.py`：用于 data.xlsx 数据迁移
- `temp_check_neo4j_data.py`：用于 data.xlsx 数据验证

### data2.xlsx 迁移脚本
- `temp_neo4j_migration_data2.py`：用于 data2.xlsx 数据迁移
- `temp_check_neo4j_data2.py`：用于 data2.xlsx 数据验证

这些脚本绕过了环境变量配置，直接使用本地连接参数（`bolt://localhost:7687`），确保在任何环境下都能正常工作。

## 维护建议

1. 在 `pyproject.toml` 中添加 `pandas` 依赖以避免未来出现模块缺失问题
2. 考虑创建专用的迁移命令或脚本，统一处理环境配置问题
3. 定期备份Neo4j数据库以防数据丢失