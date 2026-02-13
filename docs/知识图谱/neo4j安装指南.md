# Neo4j Desktop 存储路径迁移指南

## 问题
Neo4j Desktop 默认将数据库存储在 C 盘，占用系统盘空间。

## 解决方案：修改存储路径到 E 盘

### 方法 1：在创建数据库时指定路径（推荐）

1. **打开 Neo4j Desktop**
2. **点击右上角齿轮图标 ⚙️ → Settings**
3. **找到 "Application data path" 或 "Database location"**
4. **点击 Change/Browse**
5. **选择新路径**：`E:\Neo4j` 或 `E:\neo4j-data`
6. **重启 Neo4j Desktop**
7. **创建新数据库**（会自动使用新路径）

### 方法 2：手动迁移已有数据库

如果已经创建了数据库：

1. **停止数据库**（点击 Stop 按钮）
2. **找到数据库文件夹**：
   - Windows 默认路径：`C:\Users\{你的用户名}\.Neo4jDesktop\relate-data\dbmss\dbms-xxxxx`
3. **复制整个数据库文件夹到 E 盘**：
   - 例如：`E:\neo4j-data\`
4. **在 Neo4j Desktop 中删除旧数据库**（仅删除引用，不删除文件）
5. **添加现有数据库**：
   - 点击 "Add" → "Local DBMS"
   - 选择 "Link to existing DBMS"
   - 浏览到 `E:\neo4j-data\dbms-xxxxx`

---

## 方法 3：直接使用 Neo4j Community Server（完全控制路径）

### 下载安装

1. **下载 Neo4j Community Server**
   - 地址：https://neo4j.com/deployment-center/
   - 选择 Community Edition → Windows

2. **解压到 E 盘**
   - 例如：`E:\neo4j-server`

3. **配置数据存储路径**
   - 编辑文件：`E:\neo4j-server\conf\neo4j.conf`
   - 取消注释并修改以下行：
     ```
     # 数据存储路径
     dbms.directories.data=E:/neo4j-data/data

     # 日志路径
     dbms.directories.logs=E:/neo4j-data/logs

     # 导入路径
     dbms.directories.import=E:/neo4j-data/import

     # 插件路径
     dbms.directories.plugins=E:/neo4j-data/plugins
     ```

4. **设置初始密码**
   ```bash
   cd E:\neo4j-server\bin
   neo4j-admin dbms set-initial-password 12345678
   ```

5. **启动 Neo4j**
   ```bash
   cd E:\neo4j-server\bin
   neo4j.bat console
   ```

6. **访问浏览器界面**
   - http://localhost:7474
   - 用户名：`neo4j`
   - 密码：`12345678`

---

## 推荐配置

### 项目中的 .env 文件配置（已配置）

```env
# Neo4j 配置 (Windows 本地安装)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DATABASE=neo4j
```

### 启动脚本（可选）

创建 `E:\neo4j-server\start-neo4j.bat`：

```batch
@echo off
cd /d E:\neo4j-server\bin
echo Starting Neo4j Server...
neo4j.bat console
```

---

## 验证安装

启动 Neo4j 后，访问：
- Neo4j Browser: http://localhost:7474
- 用户名: neo4j
- 密码: 12345678

在浏览器中运行测试查询：
```cypher
// 创建测试节点
CREATE (n:Test {name: 'Hello Neo4j'}) RETURN n

// 查询所有节点
MATCH (n) RETURN n LIMIT 25
```

---

## 卸载 C 盘旧数据

确认 E 盘版本运行正常后，可以删除 C 盘数据：

1. **卸载 Neo4j Desktop**（如果不再使用）
2. **删除数据文件夹**：
   - `C:\Users\{用户名}\.Neo4jDesktop\`
   - `C:\Users\{用户名}\AppData\Local\Neo4j\`
   - `C:\Users\{用户名}\AppData\Roaming\Neo4j Desktop\`

---

## 常见问题

### Q: 启动失败，提示端口被占用
**A:** 检查是否有其他 Neo4j 实例在运行：
```bash
netstat -ano | findstr ":7474"
netstat -ano | findstr ":7687"
```

### Q: 忘记密码怎么办？
**A:** 重置密码：
```bash
cd E:\neo4j-server\bin
neo4j-admin dbms set-initial-password 12345678
```

### Q: 数据库启动慢
**A:** 调整内存配置（`neo4j.conf`）：
```
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=1G
dbms.memory.pagecache.size=512m
```
