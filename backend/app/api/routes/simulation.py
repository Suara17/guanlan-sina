"""
异常模拟 API 路由

提供异常模拟情境的查询和执行功能，用于演示系统运行流程。
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import (
    SimulationScenario,
    SimulationScenarioPublic,
    SimulationScenarioSummary,
    SimulationExecuteRequest,
    SimulationExecuteResponse,
)

router = APIRouter()

# 预设模拟情境数据（用于初始化和演示）
DEFAULT_SIMULATION_SCENARIOS: list[dict[str, Any]] = [
    {
        "scenario_code": "SIM-001",
        "scenario_name": "锡焊不到位连续10个不良",
        "description": "SMT产线锡焊工位连续出现焊接不良，需要进行根因分析和方案决策。",
        "anomaly_type": "焊接缺陷",
        "anomaly_location": "回流焊#3",
        "severity": "critical",
        "root_cause": "回流焊温度曲线偏移，峰值温度不足导致焊锡未完全熔化",
        "root_cause_confidence": 0.92,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：调整回流焊温度曲线",
                "description": "根据焊锡规格调整温度曲线，提高峰值温度15°C",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.5,
                "delivery_impact_cost": 4000.0,
                "quality_risk_cost": 500.0,
                "downtime_cost": 6000.0,
                "total_expected_loss": 10500.0,
                "implementation_time_hours": 0.5,
                "success_rate": 0.92,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：更换焊锡批次",
                "description": "检查焊锡批次是否有问题，必要时更换新批次",
                "repair_cost": 3000.0,
                "delivery_impact_hours": 1.0,
                "delivery_impact_cost": 8000.0,
                "quality_risk_cost": 200.0,
                "downtime_cost": 12000.0,
                "total_expected_loss": 23200.0,
                "implementation_time_hours": 1.0,
                "success_rate": 0.85,
                "risk_level": "medium",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "锡焊不到位", "description": "连续10个焊接不良", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "焊锡未完全熔化", "description": "焊点润湿不良", "x": 300, "y": 150},
            {"id": "node-3", "type": "direct_cause", "label": "温度不足", "description": "峰值温度偏低", "x": 500, "y": 150},
            {"id": "node-4", "type": "root_cause", "label": "回流焊温度曲线偏移", "description": "工艺参数漂移", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-1", "target": "node-3", "type": "caused_by"},
            {"id": "edge-3", "source": "node-2", "target": "node-4", "type": "caused_by"},
            {"id": "edge-4", "source": "node-3", "target": "node-4", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "锡焊不到位连续10个不良", "type": "phenomenon"},
            {"step": 2, "description": "焊锡未完全熔化，润湿不良", "type": "direct_cause"},
            {"step": 3, "description": "回流焊温度曲线偏移，峰值温度不足", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-002",
        "scenario_name": "贴片机抛料率超8%",
        "description": "贴片机抛料率异常升高，影响生产效率和成本。",
        "anomaly_type": "贴装异常",
        "anomaly_location": "贴片机#5",
        "severity": "error",
        "root_cause": "吸嘴N-204磨损导致真空吸附力下降",
        "root_cause_confidence": 0.88,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：立即停机更换吸嘴",
                "description": "根因置信度88%。更换备件库中的N-204型吸嘴。",
                "repair_cost": 2500.0,
                "delivery_impact_hours": 0.25,
                "delivery_impact_cost": 8000.0,
                "quality_risk_cost": 500.0,
                "downtime_cost": 12000.0,
                "total_expected_loss": 23000.0,
                "implementation_time_hours": 0.25,
                "success_rate": 0.92,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：调整气压参数补偿",
                "description": "临时提高真空发生器负压至-85kPa，维持生产。",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.03,
                "delivery_impact_cost": 1000.0,
                "quality_risk_cost": 3000.0,
                "downtime_cost": 0.0,
                "total_expected_loss": 4000.0,
                "implementation_time_hours": 0.03,
                "success_rate": 0.75,
                "risk_level": "medium",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "抛料率超8%", "description": "贴片机抛料异常", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "吸附力不足", "description": "真空负压偏低", "x": 300, "y": 150},
            {"id": "node-3", "type": "direct_cause", "label": "元件移位", "description": "贴装过程中脱落", "x": 500, "y": 150},
            {"id": "node-4", "type": "root_cause", "label": "吸嘴磨损", "description": "N-204吸嘴磨损", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-1", "target": "node-3", "type": "caused_by"},
            {"id": "edge-3", "source": "node-2", "target": "node-4", "type": "caused_by"},
            {"id": "edge-4", "source": "node-3", "target": "node-4", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "贴片机抛料率超过8%", "type": "phenomenon"},
            {"step": 2, "description": "真空吸附力下降，元件移位脱落", "type": "direct_cause"},
            {"step": 3, "description": "吸嘴N-204磨损导致密封不良", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-003",
        "scenario_name": "回流焊温度异常",
        "description": "回流焊炉温区温度波动异常，可能导致焊接质量问题。",
        "anomaly_type": "温度异常",
        "anomaly_location": "回流焊#2",
        "severity": "error",
        "root_cause": "加热区热电偶老化，温度反馈不准",
        "root_cause_confidence": 0.85,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：更换热电偶传感器",
                "description": "更换老化的热电偶，校准温度控制系统",
                "repair_cost": 1800.0,
                "delivery_impact_hours": 2.0,
                "delivery_impact_cost": 16000.0,
                "quality_risk_cost": 800.0,
                "downtime_cost": 20000.0,
                "total_expected_loss": 38600.0,
                "implementation_time_hours": 2.0,
                "success_rate": 0.95,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：临时调整PID参数",
                "description": "调整PID控制参数补偿温度偏差",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.5,
                "delivery_impact_cost": 4000.0,
                "quality_risk_cost": 5000.0,
                "downtime_cost": 5000.0,
                "total_expected_loss": 14000.0,
                "implementation_time_hours": 0.5,
                "success_rate": 0.70,
                "risk_level": "medium",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "温度异常", "description": "炉温波动超限", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "温控偏差", "description": "设定值与实际值偏差大", "x": 400, "y": 150},
            {"id": "node-3", "type": "root_cause", "label": "热电偶老化", "description": "传感器精度下降", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "回流焊温度区温度异常波动", "type": "phenomenon"},
            {"step": 2, "description": "温度控制偏差大，设定与实际不符", "type": "direct_cause"},
            {"step": 3, "description": "热电偶老化导致温度反馈不准", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-004",
        "scenario_name": "AOI误检率过高",
        "description": "AOI检测设备误检率升高，导致过多假报警，影响生产效率。",
        "anomaly_type": "检测异常",
        "anomaly_location": "AOI#1",
        "severity": "warning",
        "root_cause": "AOI光源亮度衰减，对比度下降",
        "root_cause_confidence": 0.90,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：校准AOI光源",
                "description": "调整光源亮度，重新校准检测阈值",
                "repair_cost": 500.0,
                "delivery_impact_hours": 0.17,
                "delivery_impact_cost": 1400.0,
                "quality_risk_cost": 300.0,
                "downtime_cost": 2000.0,
                "total_expected_loss": 4200.0,
                "implementation_time_hours": 0.17,
                "success_rate": 0.95,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：放宽检测阈值",
                "description": "临时放宽检测阈值，减少误报",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.03,
                "delivery_impact_cost": 250.0,
                "quality_risk_cost": 2000.0,
                "downtime_cost": 0.0,
                "total_expected_loss": 2250.0,
                "implementation_time_hours": 0.03,
                "success_rate": 0.80,
                "risk_level": "high",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "误检率过高", "description": "假报警增多", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "图像对比度低", "description": "检测边界模糊", "x": 400, "y": 150},
            {"id": "node-3", "type": "root_cause", "label": "光源衰减", "description": "LED亮度下降", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "AOI误检率超过标准值", "type": "phenomenon"},
            {"step": 2, "description": "图像对比度低，检测边界模糊", "type": "direct_cause"},
            {"step": 3, "description": "LED光源亮度衰减", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-005",
        "scenario_name": "印刷机刮刀磨损",
        "description": "锡膏印刷机刮刀磨损，导致印刷质量下降。",
        "anomaly_type": "印刷异常",
        "anomaly_location": "印刷机#1",
        "severity": "critical",
        "root_cause": "刮刀橡胶条磨损严重，印刷压力不均匀",
        "root_cause_confidence": 0.93,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：更换刮刀橡胶条",
                "description": "更换新刮刀橡胶条，重新校准印刷压力",
                "repair_cost": 4000.0,
                "delivery_impact_hours": 4.0,
                "delivery_impact_cost": 32000.0,
                "quality_risk_cost": 1000.0,
                "downtime_cost": 40000.0,
                "total_expected_loss": 77000.0,
                "implementation_time_hours": 4.0,
                "success_rate": 0.98,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：调整印刷参数补偿",
                "description": "调整印刷速度和压力参数，临时维持生产",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.5,
                "delivery_impact_cost": 4000.0,
                "quality_risk_cost": 8000.0,
                "downtime_cost": 5000.0,
                "total_expected_loss": 17000.0,
                "implementation_time_hours": 0.5,
                "success_rate": 0.65,
                "risk_level": "high",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "印刷质量下降", "description": "锡膏厚度不均", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "印刷压力不均", "description": "刮刀压力分布异常", "x": 400, "y": 150},
            {"id": "node-3", "type": "root_cause", "label": "刮刀磨损", "description": "橡胶条磨损严重", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "锡膏印刷质量下降", "type": "phenomenon"},
            {"step": 2, "description": "印刷压力分布不均匀", "type": "direct_cause"},
            {"step": 3, "description": "刮刀橡胶条磨损严重", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-006",
        "scenario_name": "AGV路径冲突",
        "description": "多台AGV在交叉路口发生路径冲突，导致物流停滞。",
        "anomaly_type": "物流异常",
        "anomaly_location": "AGV调度系统",
        "severity": "warning",
        "root_cause": "AGV调度算法未考虑高峰期流量，路径规划不合理",
        "root_cause_confidence": 0.95,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：优化AGV调度算法",
                "description": "更新调度算法，增加流量预测和动态避让",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.5,
                "delivery_impact_cost": 4000.0,
                "quality_risk_cost": 0.0,
                "downtime_cost": 5000.0,
                "total_expected_loss": 9000.0,
                "implementation_time_hours": 0.5,
                "success_rate": 1.0,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：临时人工调度",
                "description": "人工干预AGV调度，手动分配任务",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.25,
                "delivery_impact_cost": 2000.0,
                "quality_risk_cost": 0.0,
                "downtime_cost": 2500.0,
                "total_expected_loss": 4500.0,
                "implementation_time_hours": 0.25,
                "success_rate": 0.90,
                "risk_level": "low",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "AGV路径冲突", "description": "物流停滞", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "调度冲突", "description": "多AGV抢占路径", "x": 300, "y": 150},
            {"id": "node-3", "type": "direct_cause", "label": "路径规划不当", "description": "无避让机制", "x": 500, "y": 150},
            {"id": "node-4", "type": "root_cause", "label": "调度算法缺陷", "description": "未考虑高峰流量", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-1", "target": "node-3", "type": "caused_by"},
            {"id": "edge-3", "source": "node-2", "target": "node-4", "type": "caused_by"},
            {"id": "edge-4", "source": "node-3", "target": "node-4", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "AGV在交叉路口发生路径冲突", "type": "phenomenon"},
            {"step": 2, "description": "调度冲突和路径规划不当", "type": "direct_cause"},
            {"step": 3, "description": "调度算法未考虑高峰期流量", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-007",
        "scenario_name": "波峰焊锡炉液位低",
        "description": "波峰焊锡炉液位低于安全线，可能导致焊接不良。",
        "anomaly_type": "焊接异常",
        "anomaly_location": "波峰焊#2",
        "severity": "critical",
        "root_cause": "锡炉消耗未及时补充，液位传感器故障未报警",
        "root_cause_confidence": 0.87,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：停机补充焊锡",
                "description": "暂停生产，补充焊锡并校准液位传感器",
                "repair_cost": 6000.0,
                "delivery_impact_hours": 8.0,
                "delivery_impact_cost": 64000.0,
                "quality_risk_cost": 2000.0,
                "downtime_cost": 80000.0,
                "total_expected_loss": 152000.0,
                "implementation_time_hours": 8.0,
                "success_rate": 0.98,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：紧急补充焊锡",
                "description": "不停机紧急补充焊锡，降低传送速度",
                "repair_cost": 6000.0,
                "delivery_impact_hours": 1.0,
                "delivery_impact_cost": 8000.0,
                "quality_risk_cost": 10000.0,
                "downtime_cost": 10000.0,
                "total_expected_loss": 34000.0,
                "implementation_time_hours": 1.0,
                "success_rate": 0.75,
                "risk_level": "high",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "液位低", "description": "锡炉液位不足", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "消耗未补充", "description": "焊锡消耗", "x": 300, "y": 150},
            {"id": "node-3", "type": "direct_cause", "label": "传感器故障", "description": "未及时报警", "x": 500, "y": 150},
            {"id": "node-4", "type": "root_cause", "label": "维护缺失", "description": "检查周期过长", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-1", "target": "node-3", "type": "caused_by"},
            {"id": "edge-3", "source": "node-2", "target": "node-4", "type": "caused_by"},
            {"id": "edge-4", "source": "node-3", "target": "node-4", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "波峰焊锡炉液位低于安全线", "type": "phenomenon"},
            {"step": 2, "description": "焊锡消耗未补充，传感器故障未报警", "type": "direct_cause"},
            {"step": 3, "description": "维护检查周期过长", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-008",
        "scenario_name": "贴片吸嘴堵塞",
        "description": "贴片机吸嘴堵塞导致吸取失败率上升。",
        "anomaly_type": "贴装异常",
        "anomaly_location": "贴片机#3",
        "severity": "warning",
        "root_cause": "吸嘴内部积聚焊锡氧化物，气路部分堵塞",
        "root_cause_confidence": 0.94,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：清洁吸嘴",
                "description": "使用专用清洁工具清理吸嘴内部",
                "repair_cost": 800.0,
                "delivery_impact_hours": 0.08,
                "delivery_impact_cost": 650.0,
                "quality_risk_cost": 200.0,
                "downtime_cost": 800.0,
                "total_expected_loss": 2450.0,
                "implementation_time_hours": 0.08,
                "success_rate": 0.98,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：更换吸嘴",
                "description": "直接更换备用吸嘴",
                "repair_cost": 1500.0,
                "delivery_impact_hours": 0.03,
                "delivery_impact_cost": 250.0,
                "quality_risk_cost": 100.0,
                "downtime_cost": 300.0,
                "total_expected_loss": 2150.0,
                "implementation_time_hours": 0.03,
                "success_rate": 1.0,
                "risk_level": "low",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "吸取失败率高", "description": "贴装异常", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "真空不足", "description": "吸附力下降", "x": 400, "y": 150},
            {"id": "node-3", "type": "root_cause", "label": "吸嘴堵塞", "description": "氧化物积聚", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "贴片机吸取失败率上升", "type": "phenomenon"},
            {"step": 2, "description": "真空吸附力不足", "type": "direct_cause"},
            {"step": 3, "description": "吸嘴内部积聚焊锡氧化物", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-009",
        "scenario_name": "钢网张力不足",
        "description": "锡膏印刷钢网张力不足，导致印刷定位偏差。",
        "anomaly_type": "印刷异常",
        "anomaly_location": "印刷机#2",
        "severity": "error",
        "root_cause": "钢网使用周期过长，张力衰减超出允许范围",
        "root_cause_confidence": 0.91,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：更换钢网",
                "description": "更换新钢网，重新校准张力",
                "repair_cost": 1200.0,
                "delivery_impact_hours": 1.0,
                "delivery_impact_cost": 8000.0,
                "quality_risk_cost": 500.0,
                "downtime_cost": 10000.0,
                "total_expected_loss": 19700.0,
                "implementation_time_hours": 1.0,
                "success_rate": 0.98,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：调整印刷参数",
                "description": "调整脱模速度和印刷压力，补偿张力不足",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.25,
                "delivery_impact_cost": 2000.0,
                "quality_risk_cost": 3000.0,
                "downtime_cost": 2500.0,
                "total_expected_loss": 7500.0,
                "implementation_time_hours": 0.25,
                "success_rate": 0.80,
                "risk_level": "medium",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "印刷定位偏差", "description": "对位不准", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "钢网变形", "description": "张力不均", "x": 400, "y": 150},
            {"id": "node-3", "type": "root_cause", "label": "张力衰减", "description": "使用周期过长", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "印刷钢网张力不足，定位偏差", "type": "phenomenon"},
            {"step": 2, "description": "钢网变形，张力分布不均", "type": "direct_cause"},
            {"step": 3, "description": "钢网使用周期过长，张力衰减", "type": "root_cause"},
        ],
    },
    {
        "scenario_code": "SIM-010",
        "scenario_name": "元件供料器卡料",
        "description": "贴片机供料器卡料，导致贴装中断。",
        "anomaly_type": "供料异常",
        "anomaly_location": "贴片机#1供料器",
        "severity": "warning",
        "root_cause": "料带导引槽磨损，料带走偏卡住",
        "root_cause_confidence": 0.96,
        "solutions": [
            {
                "id": "A",
                "title": "方案A：更换导引槽",
                "description": "更换磨损的导引槽，校准料带路径",
                "repair_cost": 300.0,
                "delivery_impact_hours": 0.05,
                "delivery_impact_cost": 400.0,
                "quality_risk_cost": 100.0,
                "downtime_cost": 500.0,
                "total_expected_loss": 1300.0,
                "implementation_time_hours": 0.05,
                "success_rate": 0.99,
                "risk_level": "low",
                "is_recommended": True,
            },
            {
                "id": "B",
                "title": "方案B：手动扶正料带",
                "description": "手动调整料带位置，临时恢复生产",
                "repair_cost": 0.0,
                "delivery_impact_hours": 0.02,
                "delivery_impact_cost": 160.0,
                "quality_risk_cost": 200.0,
                "downtime_cost": 200.0,
                "total_expected_loss": 560.0,
                "implementation_time_hours": 0.02,
                "success_rate": 0.85,
                "risk_level": "low",
                "is_recommended": False,
            },
        ],
        "knowledge_graph_nodes": [
            {"id": "node-1", "type": "phenomenon", "label": "供料器卡料", "description": "贴装中断", "x": 400, "y": 50},
            {"id": "node-2", "type": "direct_cause", "label": "料带走偏", "description": "路径偏移", "x": 400, "y": 150},
            {"id": "node-3", "type": "root_cause", "label": "导引槽磨损", "description": "部件老化", "x": 400, "y": 250},
        ],
        "knowledge_graph_edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2", "type": "caused_by"},
            {"id": "edge-2", "source": "node-2", "target": "node-3", "type": "caused_by"},
        ],
        "causation_chain": [
            {"step": 1, "description": "供料器卡料导致贴装中断", "type": "phenomenon"},
            {"step": 2, "description": "料带走偏卡在导引槽", "type": "direct_cause"},
            {"step": 3, "description": "料带导引槽磨损", "type": "root_cause"},
        ],
    },
]


def init_default_scenarios(session: SessionDep) -> None:
    """初始化默认模拟情境数据"""
    for scenario_data in DEFAULT_SIMULATION_SCENARIOS:
        existing = session.exec(
            select(SimulationScenario).where(
                SimulationScenario.scenario_code == scenario_data["scenario_code"]
            )
        ).first()
        if not existing:
            scenario = SimulationScenario(
                scenario_code=scenario_data["scenario_code"],
                scenario_name=scenario_data["scenario_name"],
                description=scenario_data["description"],
                anomaly_type=scenario_data["anomaly_type"],
                anomaly_location=scenario_data["anomaly_location"],
                severity=scenario_data["severity"],
                root_cause=scenario_data["root_cause"],
                root_cause_confidence=scenario_data["root_cause_confidence"],
                solutions=scenario_data["solutions"],
                knowledge_graph_nodes=scenario_data["knowledge_graph_nodes"],
                knowledge_graph_edges=scenario_data["knowledge_graph_edges"],
                causation_chain=scenario_data["causation_chain"],
            )
            session.add(scenario)
    session.commit()


@router.get("/scenarios", response_model=list[SimulationScenarioSummary])
def get_simulation_scenarios(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """获取模拟情境列表（摘要信息）"""
    # 确保有默认数据
    init_default_scenarios(session)

    statement = select(SimulationScenario).offset(skip).limit(limit)
    scenarios = session.exec(statement).all()

    return [
        SimulationScenarioSummary(
            id=s.id,
            scenario_code=s.scenario_code,
            scenario_name=s.scenario_name,
            severity=s.severity,
            description=s.description,
        )
        for s in scenarios
    ]


@router.get("/scenarios/{scenario_id}", response_model=SimulationScenarioPublic)
def get_simulation_scenario_detail(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
) -> Any:
    """获取单个模拟情境详情"""
    init_default_scenarios(session)

    scenario = session.get(SimulationScenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Simulation scenario not found")

    return SimulationScenarioPublic(
        id=scenario.id,
        scenario_code=scenario.scenario_code,
        scenario_name=scenario.scenario_name,
        description=scenario.description,
        anomaly_type=scenario.anomaly_type,
        anomaly_location=scenario.anomaly_location,
        severity=scenario.severity,
        root_cause=scenario.root_cause,
        root_cause_confidence=scenario.root_cause_confidence,
        solutions=scenario.solutions,
        knowledge_graph_nodes=scenario.knowledge_graph_nodes,
        knowledge_graph_edges=scenario.knowledge_graph_edges,
    )


@router.post("/execute", response_model=SimulationExecuteResponse)
def execute_simulation(
    *,
    session: SessionDep,
    request: SimulationExecuteRequest,
) -> Any:
    """执行模拟，返回模拟数据用于前端展示"""
    init_default_scenarios(session)

    scenario = session.get(SimulationScenario, request.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Simulation scenario not found")

    # 生成模拟ID
    simulation_id = uuid.uuid4()

    # 构建异常数据
    anomaly_data = {
        "id": str(uuid.uuid4()),
        "defect_type": scenario.anomaly_type,
        "severity": scenario.severity,
        "location": scenario.anomaly_location,
        "detected_at": datetime.utcnow().isoformat(),
        "status": "open",
    }

    # 构建根因数据
    root_cause_data = {
        "root_cause": scenario.root_cause,
        "confidence": scenario.root_cause_confidence,
        "causation_chain": scenario.causation_chain,
    }

    # 构建知识图谱数据
    knowledge_graph = {
        "nodes": scenario.knowledge_graph_nodes,
        "edges": scenario.knowledge_graph_edges,
    }

    return SimulationExecuteResponse(
        simulation_id=simulation_id,
        anomaly_data=anomaly_data,
        root_cause=root_cause_data,
        solutions=scenario.solutions,
        knowledge_graph=knowledge_graph,
        redirect_url=f"/app/simulation?scenario_id={request.scenario_id}",
    )
