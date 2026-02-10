import logging
from typing import List, Dict, Any, Optional

from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


class Neo4jService:
    """Neo4j 知识图谱服务"""

    def __init__(self, uri: str, user: str, password: str, database: str = "neo4j"):
        self.driver = GraphDatabase.driver(
            uri, auth=(user, password), database=database
        )
        self.database = database
        logger.info(f"Neo4j service initialized with database: {database}")

    def close(self):
        """关闭数据库连接"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j driver closed")

    def execute_query(
        self, query: str, parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
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
            "CREATE INDEX solution_priority IF NOT EXISTS FOR (s:Solution) ON (s.priority)",
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
                line_types = set(record["产线类型"] for record in data)

                for line_type in line_types:
                    session.run(
                        """
                        MERGE (l:LineType {name: $line_type})
                        SET l.category = $line_type,
                            l.description = $description,
                            l.created_at = datetime(),
                            l.updated_at = datetime()
                    """,
                        line_type=line_type,
                        description=f"{line_type}生产线",
                    )

                # 按序号分组处理数据
                anomalies = {}
                for record in data:
                    seq = record["序号"]
                    if seq not in anomalies:
                        anomalies[seq] = {
                            "line_type": record["产线类型"],
                            "sequence": seq,
                            "anomaly": record["异常现象"],
                            "causes": [],
                        }

                    cause_info = {
                        "type": record["原因编号"],
                        "description": record["原因内容"],
                        "temp_solution": record["临时解决办法"],
                        "permanent_solution": record["长期解决办法"],
                    }

                    anomalies[seq]["causes"].append(cause_info)

                # 创建异常和原因关系
                for seq, anomaly_info in anomalies.items():
                    # 创建异常节点
                    session.run(
                        """
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
                        MERGE (l)-[:HAS_ANOMALY]->(a)
                    """,
                        line_type=anomaly_info["line_type"],
                        sequence=anomaly_info["sequence"],
                        anomaly_name=f"异常-{anomaly_info['sequence']}",
                        phenomenon=anomaly_info["anomaly"],
                        severity="HIGH",
                    )

                    # 为每个原因创建原因节点和解决方案节点
                    for cause_info in anomaly_info["causes"]:
                        cause_name = cause_info["type"]

                        # 创建原因节点
                        session.run(
                            """
                            MATCH (a:Anomaly {sequence: $sequence})
                            MERGE (c:Cause {
                                type: $cause_type,
                                description: $description,
                                confidence: $confidence,
                                impact_level: $impact_level,
                                created_at: datetime(),
                                updated_at: datetime()
                            })
                            MERGE (a)-[:CAUSED_BY {
                                causation_level: 8,
                                certainty: 0.9
                            }]->(c)
                        """,
                            sequence=anomaly_info["sequence"],
                            cause_type=cause_name,
                            description=cause_info["description"][:200],
                            confidence=0.8 if cause_name == "直接原因" else 0.7,
                            impact_level="HIGH" if cause_name == "直接原因" else "MEDIUM",
                        )

                        # 创建临时解决方案节点
                        if cause_info["temp_solution"]:
                            session.run(
                                """
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
                                MERGE (c)-[:SOLVED_BY {
                                    effectiveness: 0.6,
                                    implementation_difficulty: 'EASY'
                                }]->(s_temp)
                            """,
                                cause_desc=cause_info["description"][:200],
                                temp_method=cause_info["temp_solution"][:200],
                                temp_time="立即执行",
                            )

                        # 创建永久解决方案节点
                        if cause_info["permanent_solution"]:
                            session.run(
                                """
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
                                MERGE (c)-[:SOLVED_BY {
                                    effectiveness: 0.9,
                                    implementation_difficulty: 'MEDIUM'
                                }]->(s_perm)
                            """,
                                cause_desc=cause_info["description"][:200],
                                perm_method=cause_info["permanent_solution"][:200],
                                perm_time="规划实施",
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

    def find_similar_anomalies(
        self, phenomenon: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
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

    def recommend_solutions(
        self, line_type: str, severity: str = None
    ) -> List[Dict[str, Any]]:
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
        OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
        RETURN
            c.description as root_cause,
            c.type as cause_type,
            COUNT(a) as anomaly_count,
            AVG(s.success_rate) as avg_solution_success
        ORDER BY anomaly_count DESC
        LIMIT 10
        """
        return self.execute_query(query, {"line_type": line_type})
