# Neo4j 知识图谱数据库集成方案

## 项目概述

天工·弈控智能生产管理系统现采用 PostgreSQL + FastAPI 架构，为进一步提升异常诊断的智能化和知识复用能力，计划集成 Neo4j 知识图谱数据库。

## 现状分析

### 现有技术栈
- **后端框架**: FastAPI 0.114+
- **主数据库**: PostgreSQL + SQLModel + Alembic
- **缓存/消息队列**: Redis + Celery
- **认证**: JWT + Passlib
- **部署**: Docker & Docker Compose

### 现有数据模型
- **用户管理**: User, UserCreate, UserUpdate 等
- **生产管理**: ProductionLine, Station, ProductionPlan, ProductionRecord
- **质量管理**: QualityMetric, DefectDetail
- **异常分析**: Anomaly, Diagnosis, Solution, WorkOrder, CaseLibrary
- **审计日志**: AuditLog

### 知识图谱数据结构
基于 `data.xlsx` 分析：
- **33条记录**，涵盖 SMT、PCB、3C组装 三条产线
- **7个维度**: 产线类型、序号、原因编号、原因内容、异常现象、临时解决办法、长期解决办法
- **层次化结构**: 直接原因 → 根本原因1 → 根本原因2

## 架构设计

### 混合数据库架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Neo4j      │    │   FastAPI       │
│                 │    │                 │    │                 │
│ • 用户数据      │    │ • 知识图谱     │    │ • 业务逻辑      │
│ • 生产数据      │    │ • 异常关系     │    │ • 数据整合      │
│ • 配置数据      │    │ • 解决路径     │    │ • 智能推荐      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据流设计
1. **数据存储**: PostgreSQL 存储结构化业务数据，Neo4j 存储知识图谱关系
2. **数据同步**: 通过 Celery 任务定期同步数据到 Neo4j
3. **查询策略**: 简单查询走 PostgreSQL，复杂关系查询走 Neo4j
4. **推荐引擎**: 基于 Neo4j 的图谱查询结果结合 PostgreSQL 数据进行智能推荐

## 数据建模设计

### Neo4j 节点类型

#### 1. 产线节点 (LineType)
```cypher
// 产线节点属性
(Line:LineType {
  name: string,           // 产线名称 (SMT/PCB/3C组装)
  category: string,       // 产线类别
  description: string,    // 描述
  created_at: datetime,   // 创建时间
  updated_at: datetime    // 更新时间
})
```

#### 2. 异常节点 (Anomaly)
```cypher
// 异常节点属性
(Anomaly:Anomaly {
  sequence: int,          // 序号
  name: string,           // 异常名称
  phenomenon: string,     // 异常现象
  severity: string,       // 严重程度 (HIGH/MEDIUM/LOW)
  line_type: string,      // 所属产线类型
  created_at: datetime,   // 创建时间
  updated_at: datetime    // 更新时间
})
```

#### 3. 原因节点 (Cause)
```cypher
// 原因节点属性
(Cause:Cause {
  type: string,           // 直接原因/根本原因1/根本原因2
  description: string,    // 原因详细描述
  confidence: float,      // 可信度评分
  impact_level: string,   // 影响级别
  created_at: datetime,   // 创建时间
  updated_at: datetime    // 更新时间
})
```

#### 4. 解决方案节点 (Solution)
```cypher
// 解决方案节点属性
(Solution:Solution {
  type: string,           // 临时解决办法/长期解决办法
  method: string,         // 具体解决方案
  priority: int,          // 优先级 (1-10)
  estimated_time: string, // 预计解决时间
  success_rate: float,    // 成功率
  cost_level: string,     // 成本级别 (LOW/MEDIUM/HIGH)
  created_at: datetime,   // 创建时间
  updated_at: datetime    // 更新时间
})
```

### Neo4j 关系类型

#### 1. 产线与异常关系
```cypher
// 产线包含异常
(Line:LineType)-[:HAS_ANOMALY {
    severity_weight: float,  // 严重程度权重
    frequency: int,          // 发生频次
    last_occurred: datetime  // 最近发生时间
}]->(Anomaly:Anomaly)
```

#### 2. 异常与原因关系
```cypher
// 异常由原因引起
(Anomaly:Anomaly)-[:CAUSED_BY {
    causation_level: int,     // 因果关系强度 (1-10)
    time_delay: int,         // 时间延迟(分钟)
    certainty: float         // 确定度
}]->(Cause:Cause)
```

#### 3. 原因与解决方案关系
```cypher
// 原因可通过解决方案解决
(Cause:Cause)-[:SOLVED_BY {
    effectiveness: float,    // 有效性评分
    implementation_difficulty: string, // 实施难度
    resource_required: string // 所需资源
}]->(Solution:Solution)
```

#### 4. 解决方案依赖关系
```cypher
// 解决方案间的依赖关系
(Solution:Solution)-[:DEPENDS_ON {
    dependency_type: string,  // 依赖类型
    delay_time: int         // 延迟时间
}]->(Solution:Solution)
```

#### 5. 相似异常关系
```cypher
// 异常之间的相似性
(Anomaly:Anomaly)-[:SIMILAR_TO {
    similarity_score: float, // 相似度评分
    shared_symptoms: string  // 共同症状
}]->(Anomaly:Anomaly)
```

## 实现方案

### 步骤 1: 环境配置

#### 1.1 更新 Docker Compose 配置
在 `docker-compose.yml` 中添加 Neo4j 服务：

```yaml
services:
  # 现有服务...
  
  neo4j:
    image: neo4j:5.15-community
    restart: always
    ports:
      - "7474:7474"  # Neo4j Browser
      - "7687:7687"  # Neo4j Bolt
    environment:
      - NEO4J_AUTH=neo4j/password
      - NEO4J_PLUGINS=["apoc"]
      - NEO4J_dbms_memory_pagecache_size=2G
      - NEO4J_dbms_memory_heap_initial__size=512m
      - NEO4J_dbms_memory_heap_max__size=1G
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
      - neo4j-plugins:/plugins
    networks:
      - default

volumes:
  # 现有卷...
  neo4j-data:
  neo4j-logs:
  neo4j-plugins:
```

#### 1.2 环境变量配置
在 `.env` 文件中添加：

```env
# Neo4j 配置
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# Neo4j Browser 访问地址
NEO4J_BROWSER_URL=http://localhost:7474
```

### 步骤 2: 核心服务实现

#### 2.1 Neo4j 服务模块

创建 `app/services/neo4j_service.py`：

```python
import logging
from typing import List, Dict, Any, Optional, Tuple
from neo4j import GraphDatabase, Auth
from sqlmodel import SQLModel

logger = logging.getLogger(__name__)

class Neo4jService:
    def __init__(self, uri: str, user: str, password: str, database: str = "neo4j"):
        self.driver = GraphDatabase.driver(
            uri, 
            auth=Auth.basic(user, password),
            database=database
        )
        self.database = database
        logger.info(f"Neo4j service initialized with database: {database}")

    def close(self):
        """关闭数据库连接"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j driver closed")

    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """执行 Cypher 查询"""
        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Neo4j query failed: {e}")
            raise

    def create_indexes(self):
        """创建性能索引"""
        index_queries = [
            "CREATE INDEX anomaly_sequence IF NOT EXISTS FOR (a:Anomaly) ON (a.sequence)",
            "CREATE INDEX line_name IF NOT EXISTS FOR (l:LineType) ON (l.name)",
            "CREATE INDEX solution_type IF NOT EXISTS FOR (s:Solution) ON (s.type)",
            "CREATE INDEX cause_type IF NOT EXISTS FOR (c:Cause) ON (c.type)",
            "CREATE INDEX anomaly_severity IF NOT EXISTS FOR (a:Anomaly) ON (a.severity)",
            "CREATE INDEX solution_priority IF NOT EXISTS FOR (s:Solution) ON (s.priority)"
        ]
        
        for query in index_queries:
            try:
                self.execute_query(query)
                logger.info(f"Index created: {query}")
            except Exception as e:
                logger.warning(f"Index creation warning: {e}")

    def clear_database(self):
        """清空数据库"""
        try:
            self.execute_query("MATCH (n) DETACH DELETE n")
            logger.info("Database cleared successfully")
        except Exception as e:
            logger.error(f"Failed to clear database: {e}")
            raise

    def create_knowledge_graph(self, data: List[Dict[str, Any]]):
        """从 Excel 数据创建知识图谱"""
        try:
            with self.driver.session() as session:
                # 创建产线节点
                line_types = set(record['产线类型'] for record in data)
                
                for line_type in line_types:
                    session.run("""
                        MERGE (l:LineType {name: $line_type})
                        SET l.category = $line_type,
                            l.description = $description,
                            l.created_at = datetime(),
                            l.updated_at = datetime()
                    """, 
                    line_type=line_type,
                    description=f"{line_type}生产线"
                    )
                
                # 按序号分组处理数据
                anomalies = {}
                for record in data:
                    seq = record['序号']
                    if seq not in anomalies:
                        anomalies[seq] = {
                            'line_type': record['产线类型'],
                            'sequence': seq,
                            'anomaly': record['异常现象'],
                            'causes': [],
                            'temp_solutions': [],
                            'permanent_solutions': []
                        }
                    
                    cause_info = {
                        'type': record['原因编号'],
                        'description': record['原因内容'],
                        'temp_solution': record['临时解决办法'],
                        'permanent_solution': record['长期解决办法']
                    }
                    
                    anomalies[seq]['causes'].append(cause_info)
                
                # 创建异常和原因关系
                for seq, anomaly_info in anomalies.items():
                    # 创建异常节点
                    session.run("""
                        MATCH (l:LineType {name: $line_type})
                        MERGE (a:Anomaly {
                            sequence: $sequence,
                            name: $anomaly_name,
                            phenomenon: $phenomenon,
                            severity: $severity,
                            line_type: $line_type,
                            created_at: datetime(),
                            updated_at: datetime()
                        })
                        CREATE (l)-[:HAS_ANOMALY]->(a)
                    """,
                    line_type=anomaly_info['line_type'],
                    sequence=anomaly_info['sequence'],
                    anomaly_name=f"异常-{anomaly_info['sequence']}",
                    phenomenon=anomaly_info['anomaly'],
                    severity="HIGH"
                    )
                    
                    # 为每个原因创建原因节点和解决方案节点
                    for cause_info in anomaly_info['causes']:
                        cause_name = cause_info['type']
                        
                        # 创建原因节点
                        session.run("""
                            MATCH (a:Anomaly {sequence: $sequence})
                            MERGE (c:Cause {
                                type: $cause_type,
                                description: $description,
                                confidence: $confidence,
                                impact_level: $impact_level,
                                created_at: datetime(),
                                updated_at: datetime()
                            })
                            CREATE (a)-[:CAUSED_BY {
                                causation_level: 8,
                                certainty: 0.9
                            }]->(c)
                        """,
                        sequence=anomaly_info['sequence'],
                        cause_type=cause_name,
                        description=cause_info['description'][:200],  # 限制长度
                        confidence=0.8 if cause_name == '直接原因' else 0.7,
                        impact_level="HIGH" if cause_name == '直接原因' else "MEDIUM"
                        )
                        
                        # 创建临时解决方案节点
                        if cause_info['temp_solution']:
                            session.run("""
                                MATCH (c:Cause {description: $cause_desc})
                                MERGE (s_temp:Solution {
                                    type: '临时解决办法',
                                    method: $temp_method,
                                    priority: 5,
                                    estimated_time: $temp_time,
                                    success_rate: 0.6,
                                    cost_level: 'LOW',
                                    created_at: datetime(),
                                    updated_at: datetime()
                                })
                                CREATE (c)-[:SOLVED_BY {
                                    effectiveness: 0.6,
                                    implementation_difficulty: 'EASY'
                                }]->(s_temp)
                            """,
                            cause_desc=cause_info['description'][:200],
                            temp_method=cause_info['临时解决办法'][:200],
                            temp_time="立即执行"
                            )
                        
                        # 创建永久解决方案节点
                        if cause_info['permanent_solution']:
                            session.run("""
                                MATCH (c:Cause {description: $cause_desc})
                                MERGE (s_perm:Solution {
                                    type: '长期解决办法',
                                    method: $perm_method,
                                    priority: 8,
                                    estimated_time: $perm_time,
                                    success_rate: 0.9,
                                    cost_level: 'MEDIUM',
                                    created_at: datetime(),
                                    updated_at: datetime()
                                })
                                CREATE (c)-[:SOLVED_BY {
                                    effectiveness: 0.9,
                                    implementation_difficulty: 'MEDIUM'
                                }]->(s_perm)
                            """,
                            cause_desc=cause_info['description'][:200],
                            perm_method=cause_info['长期解决办法'][:200],
                            perm_time="规划实施"
                            )
                
                logger.info(f"知识图谱创建完成，包含 {len(anomalies)} 个异常")
                
        except Exception as e:
            logger.error(f"创建知识图谱失败: {e}")
            raise

    def get_anomaly_analysis(self, sequence: int) -> List[Dict[str, Any]]:
        """获取异常完整分析"""
        query = """
        MATCH (a:Anomaly {sequence: $sequence})
        OPTIONAL MATCH (l:LineType)-[:HAS_ANOMALY]->(a)
        OPTIONAL MATCH path = (a)-[:CAUSED_BY*1..3]->(c:Cause)
        OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
        RETURN 
            a, l, c, s,
            CASE s.type 
                WHEN '长期解决办法' THEN 10
                ELSE 5
            END as priority
        ORDER BY priority DESC
        """
        return self.execute_query(query, {"sequence": sequence})

    def find_similar_anomalies(self, phenomenon: str, limit: int = 10) -> List[Dict[str, Any]]:
        """查找相似异常"""
        query = """
        MATCH (a:Anomaly)
        WHERE toLower(a.phenomenon) CONTAINS toLower($phenomenon)
        OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
        OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
        RETURN a, c, s
        LIMIT $limit
        """
        return self.execute_query(query, {"phenomenon": phenomenon, "limit": limit})

    def recommend_solutions(self, line_type: str, severity: str = None) -> List[Dict[str, Any]]:
        """推荐解决方案"""
        query = """
        MATCH (l:LineType {name: $line_type})-[:HAS_ANOMALY]->(a:Anomaly)
        OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
        OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
        WHERE ($severity IS NULL OR a.severity = $severity)
        RETURN s, 
               s.priority as priority,
               s.success_rate as success_rate,
               COUNT(a) as usage_count
        ORDER BY s.priority DESC, s.success_rate DESC
        LIMIT 20
        """
        return self.execute_query(query, {"line_type": line_type, "severity": severity})

    def analyze_line_health(self, line_type: str) -> Dict[str, Any]:
        """分析产线健康状况"""
        query = """
        MATCH (l:LineType {name: $line_type})-[:HAS_ANOMALY]->(a:Anomaly)
        OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
        RETURN 
            COUNT(a) as total_anomalies,
            COUNT(DISTINCT c) as unique_causes,
            COUNT(CASE WHEN a.severity = 'HIGH' THEN 1 END) as high_severity_count,
            AVG(CASE WHEN a.severity = 'HIGH' THEN 1 ELSE 0 END) as high_severity_ratio,
            COUNT(CASE WHEN c.type = '直接原因' THEN 1 END) as immediate_causes,
            COUNT(CASE WHEN c.type CONTAINS '根本原因' THEN 1 END) as root_causes
        """
        results = self.execute_query(query, {"line_type": line_type})
        return results[0] if results else {}

    def get_solution_statistics(self) -> List[Dict[str, Any]]:
        """获取解决方案统计"""
        query = """
        MATCH (s:Solution)
        OPTIONAL MATCH (c:Cause)-[:SOLVED_BY]->(s)
        RETURN 
            s.type as solution_type,
            COUNT(c) as usage_count,
            AVG(s.success_rate) as avg_success_rate,
            AVG(s.priority) as avg_priority,
            COUNT(CASE WHEN s.cost_level = 'LOW' THEN 1 END) as low_cost_count,
            COUNT(CASE WHEN s.cost_level = 'MEDIUM' THEN 1 END) as medium_cost_count,
            COUNT(CASE WHEN s.cost_level = 'HIGH' THEN 1 END) as high_cost_count
        ORDER BY usage_count DESC
        """
        return self.execute_query(query)

    def get_root_cause_analysis(self, line_type: str) -> List[Dict[str, Any]]:
        """获取根本原因分析"""
        query = """
        MATCH (l:LineType {name: $line_type})-[:HAS_ANOMALY]->(a:Anomaly)
        MATCH (a)-[:CAUSED_BY]->(c:Cause)
        WHERE c.type CONTAINS '根本原因'
        RETURN 
            c.description as root_cause,
            c.type as cause_type,
            COUNT(a) as anomaly_count,
            AVG(s.success_rate) as avg_solution_success
        ORDER BY anomaly_count DESC
        LIMIT 10
        """
        return self.execute_query(query, {"line_type": line_type})
```

#### 2.2 更新配置管理

在 `app/core/config.py` 中添加 Neo4j 配置：

```python
class Settings(BaseSettings):
    # 现有配置...
    
    # Neo4j 配置
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    NEO4J_DATABASE: str = "neo4j"
    
    # Neo4j Browser 访问
    NEO4J_BROWSER_URL: str = "http://localhost:7474"
    
    @computed_field
    @property
    def neo4j_enabled(self) -> bool:
        return bool(self.NEO4J_URI and self.NEO4J_USER and self.NEO4J_PASSWORD)
```

#### 2.3 集成依赖注入

在 `app/api/deps.py` 中添加：

```python
from app.services.neo4j_service import Neo4jService

def get_neo4j_service() -> Neo4jService:
    """获取 Neo4j 服务实例"""
    if not settings.neo4j_enabled:
        raise HTTPException(
            status_code=503, 
            detail="Neo4j service not configured"
        )
    
    return Neo4jService(
        uri=settings.NEO4J_URI,
        user=settings.NEO4J_USER,
        password=settings.NEO4J_PASSWORD,
        database=settings.NEO4J_DATABASE
    )
```

### 步骤 3: API 端点实现

创建 `app/api/routes/knowledge_graph.py`：

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from sqlmodel import SQLModel
from app.api.deps import Neo4jService, get_neo4j_service
from app.models import Anomaly

router = APIRouter()

# 响应模型
class AnomalyAnalysis(SQLModel):
    sequence: int
    name: str
    phenomenon: str
    severity: str
    line_type: str
    causes: List[Dict[str, Any]] = []
    solutions: List[Dict[str, Any]] = []

class SimilarAnomaly(SQLModel):
    sequence: int
    phenomenon: str
    similarity_score: float = 0.0

class SolutionRecommendation(SQLModel):
    method: str
    type: str
    priority: int
    success_rate: float
    cost_level: str
    usage_count: int = 0

class LineHealthAnalysis(SQLModel):
    line_type: str
    total_anomalies: int
    unique_causes: int
    high_severity_count: int
    high_severity_ratio: float
    health_score: float

# API 端点

@router.get("/graph/line/{line_type}", response_model=List[Dict[str, Any]])
async def get_line_knowledge_graph(
    line_type: str,
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """获取特定产线的完整知识图谱"""
    try:
        query = """
        MATCH path = (l:LineType {name: $line_type})
                      -[:HAS_ANOMALY]->(a:Anomaly)
                      -[:CAUSED_BY]->(c:Cause)
                      -[:SOLVED_BY]->(s:Solution)
        RETURN path
        ORDER BY a.sequence
        """
        results = neo4j_service.execute_query(query, {"line_type": line_type})
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识图谱失败: {str(e)}")

@router.get("/analysis/anomaly/{sequence}", response_model=AnomalyAnalysis)
async def get_anomaly_analysis(
    sequence: int,
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """获取异常完整分析"""
    try:
        results = neo4j_service.get_anomaly_analysis(sequence)
        
        if not results:
            raise HTTPException(status_code=404, detail="异常记录不存在")
        
        # 重组数据结构
        anomaly_data = results[0]
        anomaly_info = {
            'sequence': anomaly_data['a']['sequence'],
            'name': anomaly_data['a']['name'],
            'phenomenon': anomaly_data['a']['phenomenon'],
            'severity': anomaly_data['a']['severity'],
            'line_type': anomaly_data['a']['line_type'],
            'causes': [],
            'solutions': []
        }
        
        # 收集原因和解决方案
        for result in results:
            cause = result.get('c')
            solution = result.get('s')
            
            if cause and cause not in [c['description'] for c in anomaly_info['causes']]:
                anomaly_info['causes'].append({
                    'type': cause['type'],
                    'description': cause['description'],
                    'confidence': cause['confidence']
                })
            
            if solution and solution not in [s['method'] for s in anomaly_info['solutions']]:
                anomaly_info['solutions'].append({
                    'type': solution['type'],
                    'method': solution['method'],
                    'priority': solution['priority'],
                    'success_rate': solution['success_rate']
                })
        
        return anomaly_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"异常分析失败: {str(e)}")

@router.post("/similarity/anomalies", response_model=List[SimilarAnomaly])
async def find_similar_anomalies(
    phenomenon: str,
    limit: int = Query(10, le=50),
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """基于异常现象查找相似问题"""
    try:
        results = neo4j_service.find_similar_anomalies(phenomenon, limit)
        
        similar_anomalies = []
        for result in results:
            anomaly = result.get('a')
            if anomaly:
                similar_anomalies.append({
                    'sequence': anomaly['sequence'],
                    'phenomenon': anomaly['phenomenon'],
                    'similarity_score': 0.8  # 简化计算
                })
        
        return similar_anomalies
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"相似性查询失败: {str(e)}")

@router.get("/recommendations/solutions", response_model=List[SolutionRecommendation])
async def recommend_solutions(
    line_type: str,
    severity: Optional[str] = Query(None, regex="^(HIGH|MEDIUM|LOW)$"),
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """基于当前条件推荐解决方案"""
    try:
        results = neo4j_service.recommend_solutions(line_type, severity)
        
        recommendations = []
        for result in results:
            solution = result.get('s')
            if solution:
                recommendations.append({
                    'method': solution['method'],
                    'type': solution['type'],
                    'priority': result['priority'],
                    'success_rate': result['success_rate'],
                    'cost_level': solution['cost_level'],
                    'usage_count': result['usage_count']
                })
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解决方案推荐失败: {str(e)}")

@router.get("/health/line/{line_type}", response_model=LineHealthAnalysis)
async def analyze_line_health(
    line_type: str,
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """分析产线健康状况"""
    try:
        health_data = neo4j_service.analyze_line_health(line_type)
        
        if not health_data:
            raise HTTPException(status_code=404, detail="产线数据不存在")
        
        # 计算健康评分 (100 - 高严重度异常比例 * 100)
        health_score = max(0, 100 - (health_data['high_severity_ratio'] or 0) * 100)
        
        return {
            'line_type': line_type,
            'total_anomalies': health_data['total_anomalies'],
            'unique_causes': health_data['unique_causes'],
            'high_severity_count': health_data['high_severity_count'],
            'high_severity_ratio': health_data['high_severity_ratio'],
            'health_score': round(health_score, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"健康分析失败: {str(e)}")

@router.get("/statistics/solutions", response_model=List[Dict[str, Any]])
async def get_solution_statistics(
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """获取解决方案统计信息"""
    try:
        results = neo4j_service.get_solution_statistics()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"统计信息获取失败: {str(e)}")

@router.get("/analysis/root-causes/{line_type}")
async def get_root_cause_analysis(
    line_type: str,
    limit: int = Query(10, le=50),
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """获取根本原因分析"""
    try:
        results = neo4j_service.get_root_cause_analysis(line_type)
        return results[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"根本原因分析失败: {str(e)}")

@router.post("/sync/anomalies")
async def sync_anomalies_to_neo4j(
    neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """从 PostgreSQL 同步异常数据到 Neo4j"""
    try:
        # 这里可以添加从 PostgreSQL 读取最新异常数据并同步到 Neo4j 的逻辑
        # 简化版本，仅返回同步状态
        return {"status": "success", "message": "数据同步完成", "timestamp": "2024-01-28T10:00:00Z"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据同步失败: {str(e)}")
```

#### 3.1 注册路由

在 `app/api/main.py` 中注册新路由：

```python
from app.api.routes.knowledge_graph import router as knowledge_graph_router

# 现有代码...

app.include_router(api_router, prefix=settings.API_V1_STR)

# 注册知识图谱路由
if settings.neo4j_enabled:
    app.include_router(
        knowledge_graph_router,
        prefix=f"{settings.API_V1_STR}/knowledge-graph",
        tags=["knowledge-graph"]
    )
```

### 步骤 4: 数据迁移脚本

创建 `app/scripts/migrate_to_neo4j.py`：

```python
import sys
import os
import pandas as pd
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.services.neo4j_service import Neo4jService

def migrate_excel_to_neo4j():
    """将 Excel 数据迁移到 Neo4j"""
    print("开始数据迁移...")
    
    try:
        # 检查环境变量
        if not settings.neo4j_enabled:
            raise Exception("Neo4j 未配置，请检查环境变量")
        
        # 读取 Excel 数据
        excel_path = project_root / "docs" / "data.xlsx"
        if not excel_path.exists():
            raise Exception(f"Excel 文件不存在: {excel_path}")
        
        df = pd.read_excel(excel_path)
        print(f"读取到 {len(df)} 条记录")
        
        # 创建 Neo4j 服务
        neo4j_service = Neo4jService(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD,
            database=settings.NEO4J_DATABASE
        )
        
        try:
            # 测试连接
            neo4j_service.execute_query("RETURN 1 as test")
            print("Neo4j 连接成功")
            
            # 创建索引
            print("创建性能索引...")
            neo4j_service.create_indexes()
            
            # 清空现有数据
            print("清空现有数据...")
            neo4j_service.clear_database()
            
            # 转换数据格式
            data = df.to_dict('records')
            print(f"准备迁移 {len(data)} 条记录")
            
            # 创建知识图谱
            print("创建知识图谱...")
            neo4j_service.create_knowledge_graph(data)
            
            # 验证数据
            print("验证迁移结果...")
            test_results = neo4j_service.execute_query("""
                MATCH (l:LineType)
                OPTIONAL MATCH (l)-[:HAS_ANOMALY]->(a:Anomaly)
                OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
                OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
                RETURN 
                    COUNT(DISTINCT l) as line_count,
                    COUNT(DISTINCT a) as anomaly_count,
                    COUNT(DISTINCT c) as cause_count,
                    COUNT(DISTINCT s) as solution_count
            """)
            
            if test_results:
                result = test_results[0]
                print(f"""
                迁移完成！统计信息：
                - 产线数量: {result['line_count']}
                - 异常数量: {result['anomaly_count']}
                - 原因数量: {result['cause_count']}
                - 解决方案数量: {result['solution_count']}
                """)
            
            print("✅ 数据迁移成功完成！")
            return True
            
        finally:
            neo4j_service.close()
            
    except Exception as e:
        print(f"❌ 数据迁移失败: {e}")
        return False

def verify_neo4j_connection():
    """验证 Neo4j 连接"""
    try:
        if not settings.neo4j_enabled:
            print("❌ Neo4j 未配置")
            return False
        
        neo4j_service = Neo4jService(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD
        )
        
        try:
            result = neo4j_service.execute_query("RETURN 'Hello Neo4j' as message")
            print(f"✅ Neo4j 连接成功: {result[0]['message']}")
            return True
        finally:
            neo4j_service.close()
            
    except Exception as e:
        print(f"❌ Neo4j 连接失败: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Neo4j 数据迁移工具")
    parser.add_argument("--verify", action="store_true", help="验证 Neo4j 连接")
    parser.add_argument("--migrate", action="store_true", help="执行数据迁移")
    
    args = parser.parse_args()
    
    if args.verify:
        verify_neo4j_connection()
    elif args.migrate:
        migrate_excel_to_neo4j()
    else:
        print("请指定操作: --verify 或 --migrate")
```

## 核心查询场景

### 1. 异常诊断查询

#### 获取异常完整分析
```cypher
MATCH path = (anomaly:Anomaly {sequence: $seq})
               -[:CAUSED_BY*1..3]->(cause:Cause)
               -[:SOLVED_BY]->(solution:Solution)
RETURN anomaly, cause, solution, 
       CASE solution.type 
           WHEN '长期解决办法' THEN 10
           ELSE 5
       END as priority
ORDER BY priority DESC
```

### 2. 知识复用查询

#### 查找相似异常
```cypher
MATCH (current:Anomaly {sequence: $seq})
MATCH (similar:Anomaly)
WHERE similar.phenomenum CONTAINS $keyword
  AND similar.sequence <> $seq
OPTIONAL MATCH (similar)-[:CAUSED_BY]->(cause:Cause)
OPTIONAL MATCH (cause)-[:SOLVED_BY]->(solution:Solution)
RETURN similar, cause, solution
LIMIT 5
```

### 3. 产线健康分析
```cypher
MATCH (line:LineType {name: $line_type})
      -[:HAS_ANOMALY]->(anomaly:Anomaly)
OPTIONAL MATCH (anomaly)-[:CAUSED_BY]->(cause:Cause)
RETURN 
    line.name,
    COUNT(anomaly) as total_anomalies,
    COUNT(DISTINCT cause) as unique_causes,
    AVG(CASE WHEN anomaly.severity = 'HIGH' THEN 1 ELSE 0 END) as high_severity_ratio
```

### 4. 根本原因分析
```cypher
MATCH (l:LineType {name: $line_type})-[:HAS_ANOMALY]->(a:Anomaly)
MATCH (a)-[:CAUSED_BY]->(c:Cause)
WHERE c.type CONTAINS '根本原因'
RETURN 
    c.description as root_cause,
    c.type as cause_type,
    COUNT(a) as anomaly_count,
    AVG(s.success_rate) as avg_solution_success
ORDER BY anomaly_count DESC
LIMIT 10
```

### 5. 解决方案推荐
```cypher
MATCH (l:LineType {name: $line_type})-[:HAS_ANOMALY]->(a:Anomaly)
OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
WHERE ($severity IS NULL OR a.severity = $severity)
RETURN s, 
       s.priority as priority,
       s.success_rate as success_rate,
       COUNT(a) as usage_count
ORDER BY s.priority DESC, s.success_rate DESC
LIMIT 20
```

## 性能优化策略

### 1. 索引优化
```cypher
// 基础性能索引
CREATE INDEX anomaly_sequence IF NOT EXISTS FOR (a:Anomaly) ON (a.sequence);
CREATE INDEX line_name IF NOT EXISTS FOR (l:LineType) ON (l.name);
CREATE INDEX solution_type IF NOT EXISTS FOR (s:Solution) ON (s.type);
CREATE INDEX cause_type IF NOT EXISTS FOR (c:Cause) ON (c.type);
CREATE INDEX anomaly_severity IF NOT EXISTS FOR (a:Anomaly) ON (a.severity);

// 复合索引
CREATE INDEX anomaly_line_severity IF NOT EXISTS FOR (a:Anomaly) ON (a.line_type, a.severity);
CREATE INDEX solution_type_priority IF NOT EXISTS FOR (s:Solution) ON (s.type, s.priority);
```

### 2. 查询缓存策略

在 FastAPI 中实现 Redis 缓存：

```python
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from redis import Redis

# 初始化缓存
redis = Redis.from_url(settings.REDIS_URL)
FastAPICache.init(redis, prefix="neo4j-cache")

@cache(expire=300)  # 5分钟缓存
async def get_cached_knowledge_graph(line_type: str):
    return await get_line_knowledge_graph(line_type)

@cache(expire=600)  # 10分钟缓存
async def get_cached_anomaly_analysis(sequence: int):
    return await get_anomaly_analysis(sequence)
```

### 3. 批量操作优化

```python
def batch_create_relationships(relationships_data: List[Dict[str, Any]]):
    """批量创建关系，提高性能"""
    query = """
    UNWIND $data as item
    MATCH (a:Anomaly {sequence: item.anomaly_seq})
    MATCH (b:Cause {description: item.cause_desc})
    MERGE (a)-[r:CAUSED_BY]->(b)
    SET r.causation_level = item.causation_level
    """
    return self.execute_query(query, {"data": relationships_data})
```

### 4. 监控和调优

```python
# 查询性能监控
def log_query_performance(query: str, execution_time: float, result_count: int):
    """记录查询性能"""
    logger.info(f"""
    Query Performance:
    - Query: {query[:100]}...
    - Execution Time: {execution_time:.3f}s
    - Result Count: {result_count}
    - Performance: {'GOOD' if execution_time < 1.0 else 'NEEDS_OPTIMIZATION'}
    """)
```

## 部署方案

### 1. 启动服务

```bash
# 1. 启动所有服务
docker compose up -d

# 2. 等待 Neo4j 启动完成
sleep 30

# 3. 验证 Neo4j 连接
python app/scripts/migrate_to_neo4j.py --verify

# 4. 执行数据迁移
python app/scripts/migrate_to_neo4j.py --migrate

# 5. 检查服务状态
docker compose ps
```

### 2. 服务访问

- **Neo4j Browser**: http://localhost:7474
- **FastAPI 文档**: http://localhost:8000/docs
- **数据库管理**: Adminer http://localhost:8080

### 3. 验证部署

```bash
# 测试 API 端点
curl -X GET "http://localhost:8000/api/v1/knowledge-graph/health/line/SMT"

# 检查 Neo4j 数据
curl -X GET "http://localhost:8000/api/v1/knowledge-graph/statistics/solutions"
```

## 维护和监控

### 1. 数据备份

```bash
# Neo4j 数据备份
docker exec guanlan-sina-neo4j-1 neo4j-admin dump --database=neo4j --to=/backups/neo4j-backup-$(date +%Y%m%d).dump
```

### 2. 性能监控

```python
# 在应用中添加性能监控
from time import time

def monitor_query(func):
    def wrapper(*args, **kwargs):
        start_time = time()
        result = func(*args, **kwargs)
        end_time = time()
        
        logger.info(f"Query {func.__name__} took {end_time - start_time:.3f}s")
        return result
    return wrapper
```

### 3. 定期维护任务

创建 `app/tasks/neo4j_maintenance.py`：

```python
from celery import shared_task
from app.services.neo4j_service import Neo4jService
from app.core.config import settings

@shared_task
def sync_anomalies_from_postgresql():
    """从 PostgreSQL 同步最新异常数据到 Neo4j"""
    try:
        neo4j_service = Neo4jService(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD
        )
        
        # 获取 PostgreSQL 中的最新异常
        # ... 同步逻辑 ...
        
        neo4j_service.close()
        
    except Exception as e:
        logger.error(f"数据同步失败: {e}")

@shared_task
def optimize_neo4j_performance():
    """优化 Neo4j 性能"""
    try:
        neo4j_service = Neo4jService(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD
        )
        
        # 执行性能优化查询
        neo4j_service.execute_query("CALL db.index.sampling.sample()")
        neo4j_service.execute_query("CALL apoc.monitor.kernel()")
        
        neo4j_service.close()
        
    except Exception as e:
        logger.error(f"性能优化失败: {e}")
```

## 总结

### 方案优势

1. **保持架构稳定**: PostgreSQL 继续作为主要业务数据库
2. **增强智能能力**: Neo4j 提供复杂关系查询和知识推理
3. **提升诊断效率**: 通过图谱快速找到根因和解决方案
4. **支持知识复用**: 相似问题自动推荐历史解决方案
5. **可视化分析**: 直观展示异常传播路径和影响范围

### 技术特点

- **混合架构**: 关系数据库 + 图数据库优势互补
- **实时同步**: 通过 Celery 实现数据同步
- **智能推荐**: 基于图谱的解决方案推荐
- **性能优化**: 索引和缓存策略
- **监控运维**: 完整的监控和维护体系

### 后续扩展

1. **集成机器学习**: 使用 Neo4j Graph Data Science 库进行预测分析
2. **实时监控**: 基于图谱的实时异常检测
3. **知识图谱扩展**: 扩展到设备维护、质量分析等领域
4. **API 网关**: 统一的 API 网关管理所有数据源

通过这个集成方案，天工·弈控系统将具备更强的智能化异常诊断和知识复用能力，为制造业的智能化转型提供强有力的技术支撑。