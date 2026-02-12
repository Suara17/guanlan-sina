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
    from app.main import app
    import json

    # 获取OpenAPI规范
    openapi_schema = app.openapi()
    print('OpenAPI schema keys:', list(openapi_schema.keys()))
    print()

    # 检查是否有知识图谱相关路径
    knowledge_paths = [path for path in openapi_schema.get('paths', {}) if 'knowledge' in path.lower() or 'graph' in path.lower()]
    print('Knowledge graph related paths found:', len(knowledge_paths))

    if not knowledge_paths:
        print('Checking all paths for knowledge graph endpoints...')
        all_paths = list(openapi_schema.get('paths', {}).keys())
        print(f'Total paths: {len(all_paths)}')
        
        # 检查是否包含知识图谱路径
        kg_paths = []
        for path in all_paths:
            if 'knowledge-graph' in path or 'knowledge_graph' in path:
                kg_paths.append(path)
        
        if kg_paths:
            print('Found knowledge graph paths:')
            for path in kg_paths:
                print(f'  {path}')
        else:
            print('No knowledge graph paths found.')
            print('\nFirst 15 paths:')
            for path in all_paths[:15]:
                print(f'  {path}')
            print(f'\nChecking if knowledge graph routes are registered...')
            
            # 检查app/api/main.py中的路由注册逻辑
            from app.core.config import settings
            print(f"Neo4j enabled: {settings.neo4j_enabled}")
            
    else:
        print('Knowledge graph paths:')
        for path in knowledge_paths:
            print(f'  {path}')

except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()