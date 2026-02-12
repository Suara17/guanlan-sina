# Neo4j 数据库配置说明

## 架构概览

前端知识图谱功能通过以下架构与Neo4j数据库交互：

```
[前端应用] 
    ↓ (API请求)
[后端API服务器] 
    ↓ (Neo4j驱动)
[Neo4j图数据库]
```

## 配置说明

### 后端配置 (.env)

```env
# Neo4j 配置
NEO4J_URI=bolt://neo4j:7687          # Docker环境使用服务名
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DATABASE=neo4j
```

### 环境差异

- **Docker环境**: `bolt://neo4j:7687` (使用Docker服务名)
- **本地开发环境**: `bolt://localhost:7687` (直接连接本地端口)

## 数据流

1. 前端调用 `KnowledgeGraphAdapter` 方法
2. 适配器通过OpenAPI客户端向后端API发起请求
3. 后端接收请求，使用Neo4j服务查询数据库
4. 数据从Neo4j返回给后端
5. 后端将数据返回给前端
6. 前端渲染知识图谱

## 故障转移机制

当Neo4j数据库不可用时：
1. `KnowledgeGraphAdapter` 检测到连接失败
2. 自动切换到模拟数据源
3. 用户界面显示"演示数据"标识
4. 功能保持可用，但使用预设的模拟数据

## 数据迁移

数据从Excel文件迁移到Neo4j的流程：
1. 读取 `docs/data.xlsx` 文件
2. 解析异常、原因、解决方案等实体
3. 在Neo4j中创建节点和关系
4. 建立完整的知识图谱结构

## API端点

- `GET /api/v1/knowledge-graph/health/line/{line_type}` - 产线健康检查
- `GET /api/v1/knowledge-graph/analysis/anomaly/{sequence}` - 异常分析
- `POST /api/v1/knowledge-graph/similarity/anomalies` - 相似异常查找
- `GET /api/v1/knowledge-graph/recommendations/solutions` - 解决方案推荐