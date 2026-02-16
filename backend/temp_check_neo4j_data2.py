#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent / "backend"
sys.path.insert(0, str(project_root))

from app.services.neo4j_service import Neo4jService


def verify_neo4j_data():
    """验证 Neo4j 数据"""
    print("开始验证 Neo4j 数据...")

    try:
        # 直接使用本地连接参数
        neo4j_service = Neo4jService(
            uri="bolt://localhost:7687",
            user="neo4j",
            password="12345678",
            database="neo4j",
        )

        try:
            # 测试连接
            neo4j_service.execute_query("RETURN 1 as test")
            print("Neo4j 连接成功\n")

            # 统计各类节点数量
            print("=" * 50)
            print("节点统计")
            print("=" * 50)

            stats = neo4j_service.execute_query(
                """
                MATCH (l:LineType)
                OPTIONAL MATCH (l)-[:HAS_ANOMALY]->(a:Anomaly)
                OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
                OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
                RETURN
                    COUNT(DISTINCT l) as line_count,
                    COUNT(DISTINCT a) as anomaly_count,
                    COUNT(DISTINCT c) as cause_count,
                    COUNT(DISTINCT s) as solution_count
            """
            )

            if stats:
                result = stats[0]
                print(f"产线数量: {result['line_count']}")
                print(f"异常数量: {result['anomaly_count']}")
                print(f"原因数量: {result['cause_count']}")
                print(f"解决方案数量: {result['solution_count']}")

            # 查看产线类型
            print("\n" + "=" * 50)
            print("产线类型列表")
            print("=" * 50)

            lines = neo4j_service.execute_query(
                """
                MATCH (l:LineType)
                OPTIONAL MATCH (l)-[:HAS_ANOMALY]->(a:Anomaly)
                RETURN l.name as line_name, COUNT(a) as anomaly_count
                ORDER BY l.name
            """
            )

            for line in lines:
                print(f"- {line['line_name']}: {line['anomaly_count']} 个异常")

            # 查看部分异常示例
            print("\n" + "=" * 50)
            print("异常示例（前5条）")
            print("=" * 50)

            anomalies = neo4j_service.execute_query(
                """
                MATCH (l:LineType)-[:HAS_ANOMALY]->(a:Anomaly)
                RETURN l.name as line_name, a.description as anomaly
                LIMIT 5
            """
            )

            for i, anomaly in enumerate(anomalies, 1):
                print(f"{i}. [{anomaly['line_name']}] {anomaly['anomaly']}")

            print("\n数据验证完成！")
            return True

        finally:
            neo4j_service.close()

    except Exception as e:
        print(f"数据验证失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    verify_neo4j_data()
