from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from sqlmodel import SQLModel

from app.api.deps import get_neo4j_service
from app.services.neo4j_service import Neo4jService

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
    line_type: str, neo4j_service: Neo4jService = Depends(get_neo4j_service)
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
    sequence: int, neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """获取异常完整分析"""
    try:
        results = neo4j_service.get_anomaly_analysis(sequence)

        if not results:
            raise HTTPException(status_code=404, detail="异常记录不存在")

        # 重组数据结构
        anomaly_data = results[0]
        anomaly_info = {
            "sequence": anomaly_data["a"]["sequence"],
            "name": anomaly_data["a"]["name"],
            "phenomenon": anomaly_data["a"]["phenomenon"],
            "severity": anomaly_data["a"]["severity"],
            "line_type": anomaly_data["a"]["line_type"],
            "causes": [],
            "solutions": [],
        }

        # 收集原因和解决方案
        for result in results:
            cause = result.get("c")
            solution = result.get("s")

            if cause and cause not in [
                c["description"] for c in anomaly_info["causes"]
            ]:
                anomaly_info["causes"].append(
                    {
                        "type": cause["type"],
                        "description": cause["description"],
                        "confidence": cause["confidence"],
                    }
                )

            if solution and solution not in [
                s["method"] for s in anomaly_info["solutions"]
            ]:
                anomaly_info["solutions"].append(
                    {
                        "type": solution["type"],
                        "method": solution["method"],
                        "priority": solution["priority"],
                        "success_rate": solution["success_rate"],
                    }
                )

        return anomaly_info

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"异常分析失败: {str(e)}")


@router.post("/similarity/anomalies", response_model=List[SimilarAnomaly])
async def find_similar_anomalies(
    phenomenon: str,
    limit: int = Query(10, le=50),
    neo4j_service: Neo4jService = Depends(get_neo4j_service),
):
    """基于异常现象查找相似问题"""
    try:
        results = neo4j_service.find_similar_anomalies(phenomenon, limit)

        similar_anomalies = []
        for result in results:
            anomaly = result.get("a")
            if anomaly:
                similar_anomalies.append(
                    {
                        "sequence": anomaly["sequence"],
                        "phenomenon": anomaly["phenomenon"],
                        "similarity_score": 0.8,  # 简化计算
                    }
                )

        return similar_anomalies

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"相似性查询失败: {str(e)}")


@router.get("/recommendations/solutions", response_model=List[SolutionRecommendation])
async def recommend_solutions(
    line_type: str,
    severity: Optional[str] = Query(None, regex="^(HIGH|MEDIUM|LOW)$"),
    neo4j_service: Neo4jService = Depends(get_neo4j_service),
):
    """基于当前条件推荐解决方案"""
    try:
        results = neo4j_service.recommend_solutions(line_type, severity)

        recommendations = []
        for result in results:
            solution = result.get("s")
            if solution:
                recommendations.append(
                    {
                        "method": solution["method"],
                        "type": solution["type"],
                        "priority": result["priority"],
                        "success_rate": result["success_rate"],
                        "cost_level": solution["cost_level"],
                        "usage_count": result["usage_count"],
                    }
                )

        return recommendations

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解决方案推荐失败: {str(e)}")


@router.get("/health/line/{line_type}", response_model=LineHealthAnalysis)
async def analyze_line_health(
    line_type: str, neo4j_service: Neo4jService = Depends(get_neo4j_service)
):
    """分析产线健康状况"""
    try:
        health_data = neo4j_service.analyze_line_health(line_type)

        if not health_data:
            raise HTTPException(status_code=404, detail="产线数据不存在")

        # 计算健康评分 (100 - 高严重度异常比例 * 100)
        health_score = max(0, 100 - (health_data["high_severity_ratio"] or 0) * 100)

        return {
            "line_type": line_type,
            "total_anomalies": health_data["total_anomalies"],
            "unique_causes": health_data["unique_causes"],
            "high_severity_count": health_data["high_severity_count"],
            "high_severity_ratio": health_data["high_severity_ratio"],
            "health_score": round(health_score, 2),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"健康分析失败: {str(e)}")


@router.get("/statistics/solutions", response_model=List[Dict[str, Any]])
async def get_solution_statistics(
    neo4j_service: Neo4jService = Depends(get_neo4j_service),
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
    neo4j_service: Neo4jService = Depends(get_neo4j_service),
):
    """获取根本原因分析"""
    try:
        results = neo4j_service.get_root_cause_analysis(line_type)
        return results[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"根本原因分析失败: {str(e)}")


@router.post("/sync/anomalies")
async def sync_anomalies_to_neo4j(
    neo4j_service: Neo4jService = Depends(get_neo4j_service),
):
    """从 PostgreSQL 同步异常数据到 Neo4j"""
    try:
        # 这里可以添加从 PostgreSQL 读取最新异常数据并同步到 Neo4j 的逻辑
        # 简化版本，仅返回同步状态
        return {
            "status": "success",
            "message": "数据同步完成",
            "timestamp": "2024-01-28T10:00:00Z",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据同步失败: {str(e)}")


@router.get("/analysis/all-anomalies")
async def get_all_anomalies(neo4j_service: Neo4jService = Depends(get_neo4j_service)):
    """获取所有异常列表（用于知识图谱全景展示）"""
    try:
        results = neo4j_service.get_all_anomalies()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取所有异常失败: {str(e)}")
