# Alembic 目录说明

本目录包含 Alembic 数据库迁移工具的配置和版本脚本。

## 目录结构

```
alembic/
├── versions/              # 数据库迁移版本脚本
│   ├── .keep
│   ├── a51268ebac7b_add_diagnosis_table_and_update_solution_.py
│   ├── a9bad07b2d87_initial_sync_with_design_doc.py
│   └── bfb9cc922d8a_fix_relationship_mapping_between_.py
├── env.py                 # Alembic 环境配置
├── script.py.mako         # 迁移脚本模板
└── README                 # Alembic 说明文档
```

## 模块说明

### env.py
Alembic 环境配置文件：
- 配置数据库连接
- 设置迁移目标元数据
- 支持在线和离线迁移模式
- 配置事务管理

### script.py.mako
迁移脚本模板文件：
- 定义迁移脚本的基本结构
- 包含 upgrade 和 downgrade 函数
- 用于生成新的迁移脚本

### versions/
数据库迁移版本脚本目录：
- 每个脚本对应一次数据库结构变更
- 文件名格式：`{revision}_{description}.py`
- 包含 `upgrade()` 和 `downgrade()` 函数

## 常用命令

### 创建新迁移
```bash
# 自动生成迁移脚本
alembic revision --autogenerate -m "描述信息"

# 创建空迁移脚本
alembic revision -m "描述信息"
```

### 应用迁移
```bash
# 应用所有待执行的迁移
alembic upgrade head

# 应用到指定版本
alembic upgrade <revision>

# 回滚一个版本
alembic downgrade -1

# 回滚到指定版本
alembic downgrade <revision>
```

### 查看迁移状态
```bash
# 查看当前版本
alembic current

# 查看迁移历史
alembic history

# 查看待执行的迁移
alembic heads
```

## 迁移版本说明

### a9bad07b2d87_initial_sync_with_design_doc.py
初始迁移脚本，与设计文档同步：
- 创建所有核心数据表
- 建立表之间的关系
- 设置索引和约束

### bfb9cc922d8a_fix_relationship_mapping_between_.py
修复关系映射问题：
- 修正表之间的外键关系
- 优化关联配置

### a51268ebac7b_add_diagnosis_table_and_update_solution_.py
添加诊断表并更新解决方案表：
- 新增 diagnoses 表
- 更新 solutions 表结构
- 建立诊断与解决方案的关联

## 注意事项

⚠️ **重要：**
1. 在生产环境执行迁移前，务必备份数据库
2. 不要手动修改已执行的迁移脚本
3. 迁移脚本应该可逆（downgrade 函数必须正确实现）
4. 在多人协作时，及时同步迁移脚本
5. 执行迁移前先在测试环境验证

## 迁移最佳实践

1. 保持迁移脚本简洁，每个脚本只做一件事
2. 使用 `--autogenerate` 时，检查生成的脚本是否正确
3. 对于复杂的数据变更，考虑在迁移脚本中处理数据迁移
4. 为迁移脚本添加清晰的注释
5. 测试 downgrade 函数确保可以安全回滚
