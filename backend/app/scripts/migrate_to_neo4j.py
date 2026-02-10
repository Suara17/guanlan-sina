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
            database=settings.NEO4J_DATABASE,
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
            data = df.to_dict("records")
            print(f"准备迁移 {len(data)} 条记录")

            # 创建知识图谱
            print("创建知识图谱...")
            neo4j_service.create_knowledge_graph(data)

            # 验证数据
            print("验证迁移结果...")
            test_results = neo4j_service.execute_query(
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

            if test_results:
                result = test_results[0]
                print(
                    f"""
                迁移完成！统计信息：
                - 产线数量: {result['line_count']}
                - 异常数量: {result['anomaly_count']}
                - 原因数量: {result['cause_count']}
                - 解决方案数量: {result['solution_count']}
                """
                )

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
            password=settings.NEO4J_PASSWORD,
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
