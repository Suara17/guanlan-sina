#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
backend_path = project_root / "backend"
sys.path.insert(0, str(backend_path))

from app.services.neo4j_service import Neo4jService

# 直接使用本地连接参数
neo4j_service = Neo4jService(
    uri="bolt://localhost:7687",  # 使用本地连接
    user="neo4j",
    password="12345678",  # 默认密码
    database="neo4j",
)

# 查询异常数据样例
results = neo4j_service.execute_query("""
    MATCH (a:Anomaly)
    RETURN a.sequence as sequence, a.name as name, a.phenomenon as phenomenon, a.line_type as line_type
    LIMIT 10
""")

print('Neo4j中的异常数据样例:')
for result in results:
    print(f'  序列号: {result["sequence"]}, 产线: {result["line_type"]}, 现象: {result["phenomenon"][:50]}...')

# 查询更多统计数据
stats_results = neo4j_service.execute_query("""
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

if stats_results:
    stats = stats_results[0]
    print(f'\n数据库统计:')
    print(f'  产线数量: {stats["line_count"]}')
    print(f'  异常数量: {stats["anomaly_count"]}')
    print(f'  原因数量: {stats["cause_count"]}')
    print(f'  解决方案数量: {stats["solution_count"]}')

neo4j_service.close()