#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
import pandas as pd
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent / "backend"
sys.path.insert(0, str(project_root))

from app.services.neo4j_service import Neo4jService


def migrate_data2_to_neo4j():
    """将 data2.xlsx 数据迁移到 Neo4j"""
    print("开始迁移 data2.xlsx 数据...")

    try:
        # 直接使用本地连接参数
        neo4j_service = Neo4jService(
            uri="bolt://localhost:7687",  # 使用本地连接
            user="neo4j",
            password="12345678",  # 默认密码
            database="neo4j",
        )

        # 读取 Excel 数据
        excel_path = Path(__file__).parent / "docs" / "知识图谱" / "data2.xlsx"
        if not excel_path.exists():
            raise Exception(f"Excel 文件不存在: {excel_path}")

        print(f"正在读取 Excel 文件: {excel_path}")
        df = pd.read_excel(excel_path)
        print(f"读取到 {len(df)} 条记录")
        print(f"列名: {list(df.columns)}")

        try:
            # 测试连接
            neo4j_service.execute_query("RETURN 1 as test")
            print("Neo4j 连接成功")

            # 创建索引（如果还没有）
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
                    f'''
                迁移完成！统计信息：
                - 产线数量: {result['line_count']}
                - 异常数量: {result['anomaly_count']}
                - 原因数量: {result['cause_count']}
                - 解决方案数量: {result['solution_count']}
                '''
                )

            print("data2.xlsx 数据迁移成功完成！")
            return True

        finally:
            neo4j_service.close()

    except Exception as e:
        print(f"数据迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    migrate_data2_to_neo4j()
