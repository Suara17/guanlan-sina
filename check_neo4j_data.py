#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
backend_path = project_root / "backend"
sys.path.insert(0, str(backend_path))

# 加载环境变量
def load_env_vars():
    env_file = project_root / ".env"
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key, value = parts
                        if '#' in value:
                            value = value.split('#')[0].strip()
                        os.environ[key.strip()] = value.strip()

# 设置默认值以避免警告
load_env_vars()
os.environ.setdefault('SECRET_KEY', 'test_key_for_testing')
os.environ.setdefault('POSTGRES_PASSWORD', 'test_password')
os.environ.setdefault('FIRST_SUPERUSER_PASSWORD', 'test_password')
os.environ.setdefault('POSTGRES_SERVER', 'localhost')
os.environ.setdefault('FIRST_SUPERUSER', 'admin@test.com')

try:
    from app.core.config import settings
    from app.services.neo4j_service import Neo4jService

    neo4j_service = Neo4jService(
        uri=settings.NEO4J_URI,
        user=settings.NEO4J_USER,
        password=settings.NEO4J_PASSWORD,
        database=settings.NEO4J_DATABASE,
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

    neo4j_service.close()
except Exception as e:
    print(f'错误: {e}')