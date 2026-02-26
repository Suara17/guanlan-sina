/**
 * 异常模拟页面
 * 展示完整的模拟流程：异常信息 → 根因分析 → 方案对比 → 执行演示
 */
import {
  AlertTriangle,
  ArrowLeft,
  Beaker,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface SimulationScenario {
  id: string
  scenario_code: string
  scenario_name: string
  description: string | null
  anomaly_type: string
  anomaly_location: string | null
  severity: 'critical' | 'error' | 'warning'
  root_cause: string | null
  root_cause_confidence: number | null
  solutions: Array<{
    id: string
    title: string
    description?: string
    repair_cost: number
    delivery_impact_hours: number
    delivery_impact_cost: number
    quality_risk_cost: number
    downtime_cost: number
    total_expected_loss: number
    implementation_time_hours: number
    success_rate: number
    risk_level: 'low' | 'medium' | 'high'
    is_recommended: boolean
  }>
  knowledge_graph_nodes: Array<{
    id: string
    type: 'phenomenon' | 'direct_cause' | 'root_cause'
    label: string
    description?: string
    x: number
    y: number
  }>
  knowledge_graph_edges: Array<{
    id: string
    source: string
    target: string
    type: string
  }>
}

// 默认模拟数据（API不可用时使用）
const DEFAULT_SIMULATION_DATA: Record<string, SimulationScenario> = {
  'sim-001': {
    id: 'sim-001',
    scenario_code: 'SIM-001',
    scenario_name: '锡焊不到位连续10个不良',
    description: 'SMT产线锡焊工位连续出现焊接不良',
    anomaly_type: '焊接缺陷',
    anomaly_location: '回流焊#3',
    severity: 'critical',
    root_cause: '回流焊温度曲线偏移，峰值温度不足导致焊锡未完全熔化',
    root_cause_confidence: 0.92,
    solutions: [
      {
        id: 'A',
        title: '方案A：调整回流焊温度曲线',
        description: '根据焊锡规格调整温度曲线，提高峰值温度15°C',
        repair_cost: 0,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 500,
        downtime_cost: 6000,
        total_expected_loss: 10500,
        implementation_time_hours: 0.5,
        success_rate: 0.92,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：更换焊锡批次',
        description: '检查焊锡批次是否有问题，必要时更换新批次',
        repair_cost: 3000,
        delivery_impact_hours: 1,
        delivery_impact_cost: 8000,
        quality_risk_cost: 200,
        downtime_cost: 12000,
        total_expected_loss: 23200,
        implementation_time_hours: 1,
        success_rate: 0.85,
        risk_level: 'medium',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '锡焊不到位', description: '连续10个焊接不良', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '焊锡未完全熔化', description: '焊点润湿不良', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '温度不足', description: '峰值温度偏低', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '回流焊温度曲线偏移', description: '工艺参数漂移', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-002': {
    id: 'sim-002',
    scenario_code: 'SIM-002',
    scenario_name: '贴片机抛料率超8%',
    description: '贴片机抛料率异常升高，影响生产效率和物料成本',
    anomaly_type: '贴装异常',
    anomaly_location: '贴片机#2',
    severity: 'error',
    root_cause: '吸嘴磨损严重导致真空吸力不足，且Feeder供料位置偏移',
    root_cause_confidence: 0.88,
    solutions: [
      {
        id: 'A',
        title: '方案A：更换磨损吸嘴并校准Feeder',
        description: '更换磨损吸嘴，同时校准Feeder供料位置',
        repair_cost: 2000,
        delivery_impact_hours: 1.5,
        delivery_impact_cost: 12000,
        quality_risk_cost: 800,
        downtime_cost: 9000,
        total_expected_loss: 23800,
        implementation_time_hours: 1.5,
        success_rate: 0.95,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：临时降低贴装速度',
        description: '降低贴装速度以减少抛料，待停机时再更换吸嘴',
        repair_cost: 0,
        delivery_impact_hours: 3,
        delivery_impact_cost: 24000,
        quality_risk_cost: 1500,
        downtime_cost: 0,
        total_expected_loss: 25500,
        implementation_time_hours: 0.25,
        success_rate: 0.75,
        risk_level: 'medium',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '抛料率超8%', description: '异常升高的抛料率', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '真空吸力不足', description: '吸嘴吸附力下降', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '供料位置偏移', description: 'Feeder精度问题', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '吸嘴磨损+Feeder偏移', description: '设备老化与校准问题', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-003': {
    id: 'sim-003',
    scenario_code: 'SIM-003',
    scenario_name: '回流焊温度异常',
    description: '回流焊炉温区温度波动异常，影响焊接质量',
    anomaly_type: '温度异常',
    anomaly_location: '回流焊#1',
    severity: 'error',
    root_cause: '温区加热管老化，PID参数需要重新整定',
    root_cause_confidence: 0.85,
    solutions: [
      {
        id: 'A',
        title: '方案A：更换加热管并重新整定PID',
        description: '更换老化的加热管，重新整定各温区PID参数',
        repair_cost: 8000,
        delivery_impact_hours: 2,
        delivery_impact_cost: 16000,
        quality_risk_cost: 1000,
        downtime_cost: 12000,
        total_expected_loss: 37000,
        implementation_time_hours: 2,
        success_rate: 0.95,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：临时调整温度补偿值',
        description: '调整温度补偿值以维持生产，待计划停机时更换加热管',
        repair_cost: 0,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 5000,
        downtime_cost: 3000,
        total_expected_loss: 12000,
        implementation_time_hours: 0.5,
        success_rate: 0.7,
        risk_level: 'high',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '温度波动异常', description: '温区温度不稳定', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '加热效率下降', description: '加热能力不足', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '控制精度下降', description: 'PID响应迟缓', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '加热管老化+PID需整定', description: '设备老化和参数漂移', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-004': {
    id: 'sim-004',
    scenario_code: 'SIM-004',
    scenario_name: 'AOI误检率过高',
    description: 'AOI检测设备误检率升高，导致过多假不良品',
    anomaly_type: '检测异常',
    anomaly_location: 'AOI#1',
    severity: 'warning',
    root_cause: 'AOI光源亮度衰减，检测阈值需要重新校准',
    root_cause_confidence: 0.82,
    solutions: [
      {
        id: 'A',
        title: '方案A：更换光源并重新校准阈值',
        description: '更换AOI光源，重新校准检测阈值和算法参数',
        repair_cost: 5000,
        delivery_impact_hours: 1,
        delivery_impact_cost: 8000,
        quality_risk_cost: 500,
        downtime_cost: 6000,
        total_expected_loss: 19500,
        implementation_time_hours: 1,
        success_rate: 0.93,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：放宽检测阈值',
        description: '临时放宽检测阈值减少误检，但可能漏检真实不良',
        repair_cost: 0,
        delivery_impact_hours: 0.25,
        delivery_impact_cost: 2000,
        quality_risk_cost: 8000,
        downtime_cost: 1500,
        total_expected_loss: 11500,
        implementation_time_hours: 0.25,
        success_rate: 0.65,
        risk_level: 'high',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '误检率过高', description: '假不良品增多', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '成像质量下降', description: '光源亮度不足', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '阈值设置不当', description: '检测参数漂移', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '光源衰减+阈值需校准', description: '设备老化和参数问题', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-005': {
    id: 'sim-005',
    scenario_code: 'SIM-005',
    scenario_name: '印刷机刮刀磨损',
    description: '锡膏印刷机刮刀磨损严重，影响印刷质量',
    anomaly_type: '印刷缺陷',
    anomaly_location: '印刷机#1',
    severity: 'critical',
    root_cause: '刮刀使用时间超过寿命，磨损导致印刷压力不均匀',
    root_cause_confidence: 0.94,
    solutions: [
      {
        id: 'A',
        title: '方案A：立即更换刮刀',
        description: '更换新刮刀并重新校准印刷压力',
        repair_cost: 1500,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 300,
        downtime_cost: 3000,
        total_expected_loss: 8800,
        implementation_time_hours: 0.5,
        success_rate: 0.98,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：调整印刷参数补偿',
        description: '调整印刷速度和压力参数进行补偿',
        repair_cost: 0,
        delivery_impact_hours: 0.25,
        delivery_impact_cost: 2000,
        quality_risk_cost: 3000,
        downtime_cost: 1500,
        total_expected_loss: 6500,
        implementation_time_hours: 0.25,
        success_rate: 0.75,
        risk_level: 'medium',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '刮刀磨损严重', description: '印刷质量下降', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '印刷压力不均', description: '刮刀边缘磨损', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '锡膏厚度异常', description: '脱模效果变差', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '刮刀使用超寿命', description: '未按时更换易损件', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-006': {
    id: 'sim-006',
    scenario_code: 'SIM-006',
    scenario_name: 'AGV路径冲突',
    description: '多台AGV在交叉路口发生路径冲突，导致物流停滞',
    anomaly_type: '物流异常',
    anomaly_location: 'AGV系统',
    severity: 'warning',
    root_cause: 'AGV调度算法优先级设置不当，多车同时申请通过交叉路口',
    root_cause_confidence: 0.86,
    solutions: [
      {
        id: 'A',
        title: '方案A：优化调度算法优先级',
        description: '重新设置AGV调度优先级规则，增加交叉路口互斥控制',
        repair_cost: 0,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 3000,
        quality_risk_cost: 200,
        downtime_cost: 2000,
        total_expected_loss: 5200,
        implementation_time_hours: 0.5,
        success_rate: 0.92,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：增加物理避障传感器',
        description: '为AGV增加物理避障传感器，提高安全性',
        repair_cost: 10000,
        delivery_impact_hours: 2,
        delivery_impact_cost: 12000,
        quality_risk_cost: 100,
        downtime_cost: 8000,
        total_expected_loss: 30100,
        implementation_time_hours: 2,
        success_rate: 0.98,
        risk_level: 'low',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: 'AGV路径冲突', description: '多车在路口拥堵', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '调度指令冲突', description: '多车同时获准通过', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '路径规划重叠', description: '最优路径经过同一路口', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '调度优先级设置不当', description: '算法逻辑缺陷', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-007': {
    id: 'sim-007',
    scenario_code: 'SIM-007',
    scenario_name: '波峰焊锡炉液位低',
    description: '波峰焊锡炉液位低于安全线，可能导致焊接不良',
    anomaly_type: '焊接缺陷',
    anomaly_location: '波峰焊#1',
    severity: 'critical',
    root_cause: '锡炉消耗未及时补充，自动加锡系统故障',
    root_cause_confidence: 0.91,
    solutions: [
      {
        id: 'A',
        title: '方案A：手动加锡并修复自动加锡系统',
        description: '立即手动添加锡条，同时修复自动加锡系统',
        repair_cost: 5000,
        delivery_impact_hours: 1,
        delivery_impact_cost: 8000,
        quality_risk_cost: 500,
        downtime_cost: 6000,
        total_expected_loss: 19500,
        implementation_time_hours: 1,
        success_rate: 0.95,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：仅手动加锡',
        description: '仅手动添加锡条，暂不修复自动加锡系统',
        repair_cost: 2000,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 1000,
        downtime_cost: 3000,
        total_expected_loss: 10000,
        implementation_time_hours: 0.5,
        success_rate: 0.8,
        risk_level: 'medium',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '锡炉液位低', description: '低于安全线', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '锡液消耗过快', description: '正常消耗未补充', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '自动加锡失效', description: '加锡系统故障', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '自动加锡系统故障', description: '设备故障未及时发现', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-008': {
    id: 'sim-008',
    scenario_code: 'SIM-008',
    scenario_name: '贴片吸嘴堵塞',
    description: '贴片机吸嘴堵塞导致吸取失败率上升',
    anomaly_type: '贴装异常',
    anomaly_location: '贴片机#1',
    severity: 'warning',
    root_cause: '吸嘴内部积聚灰尘和锡膏残留，定期清洁未执行',
    root_cause_confidence: 0.89,
    solutions: [
      {
        id: 'A',
        title: '方案A：清洁吸嘴并加强清洁频率',
        description: '清洁堵塞吸嘴，将清洁频率从每班一次改为每4小时一次',
        repair_cost: 0,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 300,
        downtime_cost: 3000,
        total_expected_loss: 7300,
        implementation_time_hours: 0.5,
        success_rate: 0.95,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：更换新吸嘴',
        description: '更换堵塞的吸嘴为全新吸嘴',
        repair_cost: 3000,
        delivery_impact_hours: 0.25,
        delivery_impact_cost: 2000,
        quality_risk_cost: 100,
        downtime_cost: 1500,
        total_expected_loss: 6600,
        implementation_time_hours: 0.25,
        success_rate: 0.98,
        risk_level: 'low',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '吸取失败率上升', description: '吸嘴堵塞', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '真空通道堵塞', description: '吸嘴内部堵塞', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '吸取力下降', description: '真空度不足', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '清洁维护未执行', description: '定期清洁计划未落实', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-009': {
    id: 'sim-009',
    scenario_code: 'SIM-009',
    scenario_name: '钢网张力不足',
    description: '锡膏印刷钢网张力不足，影响印刷精度',
    anomaly_type: '印刷缺陷',
    anomaly_location: '印刷机#1',
    severity: 'error',
    root_cause: '钢网使用时间过长，张力衰减超过允许范围',
    root_cause_confidence: 0.87,
    solutions: [
      {
        id: 'A',
        title: '方案A：更换新钢网',
        description: '更换张力合格的新钢网',
        repair_cost: 3000,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 400,
        downtime_cost: 3000,
        total_expected_loss: 10400,
        implementation_time_hours: 0.5,
        success_rate: 0.98,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：重新绷紧钢网',
        description: '尝试重新绷紧钢网恢复张力',
        repair_cost: 500,
        delivery_impact_hours: 1,
        delivery_impact_cost: 8000,
        quality_risk_cost: 2000,
        downtime_cost: 6000,
        total_expected_loss: 16500,
        implementation_time_hours: 1,
        success_rate: 0.7,
        risk_level: 'medium',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '钢网张力不足', description: '印刷精度下降', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '钢网变形', description: '网孔位置偏移', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '脱模不良', description: '锡膏图形模糊', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '钢网使用时间过长', description: '超过使用寿命未更换', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
  'sim-010': {
    id: 'sim-010',
    scenario_code: 'SIM-010',
    scenario_name: '元件供料器卡料',
    description: '贴片机供料器卡料导致贴装中断',
    anomaly_type: '供料异常',
    anomaly_location: '贴片机#2',
    severity: 'warning',
    root_cause: '供料器步进电机故障，料带传送不顺畅',
    root_cause_confidence: 0.84,
    solutions: [
      {
        id: 'A',
        title: '方案A：更换供料器',
        description: '更换故障供料器，送修故障供料器',
        repair_cost: 2000,
        delivery_impact_hours: 0.5,
        delivery_impact_cost: 4000,
        quality_risk_cost: 300,
        downtime_cost: 3000,
        total_expected_loss: 9300,
        implementation_time_hours: 0.5,
        success_rate: 0.95,
        risk_level: 'low',
        is_recommended: true,
      },
      {
        id: 'B',
        title: '方案B：手动辅助供料',
        description: '操作员手动辅助供料继续生产',
        repair_cost: 0,
        delivery_impact_hours: 2,
        delivery_impact_cost: 16000,
        quality_risk_cost: 1000,
        downtime_cost: 2000,
        total_expected_loss: 19000,
        implementation_time_hours: 0.1,
        success_rate: 0.6,
        risk_level: 'high',
        is_recommended: false,
      },
    ],
    knowledge_graph_nodes: [
      { id: 'node-1', type: 'phenomenon', label: '供料器卡料', description: '贴装中断', x: 400, y: 50 },
      { id: 'node-2', type: 'direct_cause', label: '料带传送不畅', description: '料带卡住', x: 300, y: 150 },
      { id: 'node-3', type: 'direct_cause', label: '步进动作异常', description: '电机运转不正常', x: 500, y: 150 },
      { id: 'node-4', type: 'root_cause', label: '步进电机故障', description: '电机驱动器或电机本身故障', x: 400, y: 250 },
    ],
    knowledge_graph_edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'caused_by' },
      { id: 'edge-2', source: 'node-1', target: 'node-3', type: 'caused_by' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', type: 'caused_by' },
      { id: 'edge-4', source: 'node-3', target: 'node-4', type: 'caused_by' },
    ],
  },
}

const severityConfig = {
  critical: { label: '严重', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  error: { label: '高', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  warning: { label: '中等', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
}

const Simulation: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scenarioId = searchParams.get('scenario_id')

  const [loading, setLoading] = useState(true)
  const [scenario, setScenario] = useState<SimulationScenario | null>(null)
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'cost' | 'time' | 'risk'>('cost')
  const [executionPhase, setExecutionPhase] = useState<'select' | 'executing' | 'completed'>('select')
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionLogs, setExecutionLogs] = useState<string[]>([])

  // 加载模拟情境数据
  useEffect(() => {
    if (scenarioId) {
      setLoading(true)
      // 首先尝试通过 scenario_code 加载（支持 sim-001 格式）
      fetch(`/api/v1/simulation/scenarios/by-code/${scenarioId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found')
          return res.json()
        })
        .then((data) => {
          setScenario(data)
          if (data.solutions?.length > 0) {
            const recommended = data.solutions.find((s: any) => s.is_recommended)
            setSelectedSolution(recommended?.id || data.solutions[0].id)
          }
        })
        .catch(() => {
          // 使用默认数据 - 先尝试按 ID 匹配，再尝试按 scenario_code 匹配
          let defaultData = DEFAULT_SIMULATION_DATA[scenarioId]

          // 如果 ID 不匹配，尝试从 ID 中提取 scenario_code（如 sim-001 -> SIM-001）
          if (!defaultData && scenarioId) {
            const codeFromId = scenarioId.replace(/^sim-?/i, 'SIM-').replace(/^sim/i, 'SIM')
            const normalizedCode = codeFromId.startsWith('SIM-') ? codeFromId : `SIM-${codeFromId.padStart(3, '0')}`

            // 遍历默认数据查找匹配的 scenario_code
            for (const key of Object.keys(DEFAULT_SIMULATION_DATA)) {
              const data = DEFAULT_SIMULATION_DATA[key]
              if (data.scenario_code === normalizedCode || data.scenario_code === scenarioId) {
                defaultData = data
                break
              }
            }
          }

          if (defaultData) {
            setScenario(defaultData)
            if (defaultData.solutions.length > 0) {
              const recommended = defaultData.solutions.find((s) => s.is_recommended)
              setSelectedSolution(recommended?.id || defaultData.solutions[0].id)
            }
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [scenarioId])

  // 执行模拟
  const handleExecute = () => {
    if (!selectedSolution) return

    setExecutionPhase('executing')
    setExecutionProgress(0)
    setExecutionLogs([])

    const solution = scenario?.solutions.find((s) => s.id === selectedSolution)
    const logs = [
      `${new Date().toLocaleTimeString()} 开始执行 ${solution?.title}...`,
      `${new Date().toLocaleTimeString()} 已通知相关设备停机`,
      `${new Date().toLocaleTimeString()} 技术人员已到达现场`,
      `${new Date().toLocaleTimeString()} 正在执行维修操作...`,
      `${new Date().toLocaleTimeString()} 执行完成，开始测试验证`,
      `${new Date().toLocaleTimeString()} 验证通过，恢复生产`,
    ]

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setExecutionProgress(progress)

      if (progress % 20 === 0 && logs.length > 0) {
        setExecutionLogs((prev) => [...prev, logs.shift() || ''])
      }

      if (progress >= 100) {
        clearInterval(interval)
        setExecutionPhase('completed')
        setExecutionLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} 模拟完成！`])
      }
    }, 100)
  }

  // 排序方案
  const getSortedSolutions = () => {
    if (!scenario?.solutions) return []
    const sorted = [...scenario.solutions]
    switch (sortBy) {
      case 'cost':
        return sorted.sort((a, b) => a.total_expected_loss - b.total_expected_loss)
      case 'time':
        return sorted.sort((a, b) => a.implementation_time_hours - b.implementation_time_hours)
      case 'risk':
        const riskOrder = { low: 0, medium: 1, high: 2 }
        return sorted.sort((a, b) => riskOrder[a.risk_level] - riskOrder[b.risk_level])
      default:
        return sorted
    }
  }

  const formatCost = (cost: number) => {
    if (cost >= 10000) return `¥${(cost / 10000).toFixed(1)}万`
    return `¥${cost.toLocaleString()}`
  }

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}分钟`
    return `${hours.toFixed(1)}小时`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险'
      case 'medium': return '中风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">加载模拟数据...</p>
        </div>
      </div>
    )
  }

  // 内置情境选择器 - 当没有选择情境时显示
  if (!scenario) {
    // 从默认数据中提取情境列表
    const scenarioList = Object.values(DEFAULT_SIMULATION_DATA).map((s) => ({
      id: s.id,
      scenario_code: s.scenario_code,
      scenario_name: s.scenario_name,
      severity: s.severity,
      description: s.description,
    }))

    const handleSelectScenario = (selectedId: string) => {
      // 直接从默认数据中获取情境并设置状态
      const selectedData = DEFAULT_SIMULATION_DATA[selectedId]
      if (selectedData) {
        // 更新 URL（不刷新页面）
        const newSearchParams = new URLSearchParams()
        newSearchParams.set('scenario_id', selectedId)
        navigate(`/app/simulation?${newSearchParams.toString()}`, { replace: true })
        
        // 直接设置状态
        setScenario(selectedData)
        if (selectedData.solutions.length > 0) {
          const recommended = selectedData.solutions.find((s) => s.is_recommended)
          setSelectedSolution(recommended?.id || selectedData.solutions[0].id)
        }
      }
    }

    return (
      <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/app/')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Beaker className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">异常模拟</h1>
                <p className="text-xs text-slate-500">选择情境开始模拟演示</p>
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
            <Beaker size={14} className="text-purple-500" />
            <span className="text-sm text-purple-700 font-medium">模拟模式</span>
          </div>
        </div>

        {/* 情境选择区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {scenarioList.map((s) => {
                const config = severityConfig[s.severity as keyof typeof severityConfig] || severityConfig.warning
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectScenario(s.id)}
                    className="relative text-left p-4 rounded-xl border-2 transition-all duration-200 group bg-white
                      hover:shadow-lg hover:scale-[1.02] hover:border-purple-300"
                  >
                    {/* 严重程度标签 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">
                        {s.scenario_code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}影响
                      </span>
                    </div>

                    {/* 标题 */}
                    <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {s.scenario_name}
                    </h3>

                    {/* 描述 */}
                    {s.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {s.description}
                      </p>
                    )}

                    {/* 图标 */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AlertTriangle className={`w-5 h-5 ${config.color}`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            <span>共 {scenarioList.length} 个预设情境</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/')}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            返回 Dashboard
          </button>
        </div>
      </div>
    )
  }

  const sevConfig = severityConfig[scenario.severity as keyof typeof severityConfig] || severityConfig.warning

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Beaker className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {scenario.scenario_name}
                <span className={`text-xs px-2 py-0.5 rounded-full ${sevConfig.badge}`}>
                  {sevConfig.label}影响
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                {scenario.scenario_code} | {scenario.anomaly_location || '未知位置'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
            <Beaker size={14} className="text-purple-500" />
            <span className="text-sm text-purple-700 font-medium">模拟模式</span>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden flex">
        {/* 左侧：根因分析 + 知识图谱 */}
        <div className="w-1/2 p-4 flex flex-col gap-4 overflow-hidden border-r border-slate-200">
          {/* 异常信息卡片 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-shrink-0">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              异常信息
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">异常类型</p>
                <p className="font-medium text-slate-800">{scenario.anomaly_type}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">发生位置</p>
                <p className="font-medium text-slate-800">{scenario.anomaly_location || '未知'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 text-xs">问题描述</p>
                <p className="font-medium text-slate-800">{scenario.description || '暂无描述'}</p>
              </div>
            </div>
          </div>

          {/* 根因分析卡片 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-shrink-0">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              根因分析
            </h2>
            <div className="space-y-3">
              {scenario.knowledge_graph_nodes
                .filter((node) => ['phenomenon', 'direct_cause', 'root_cause'].includes(node.type))
                .map((node, index) => (
                  <div key={node.id} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        node.type === 'phenomenon'
                          ? 'bg-orange-100 text-orange-600'
                          : node.type === 'direct_cause'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-0.5">
                        {node.type === 'phenomenon'
                          ? '现象'
                          : node.type === 'direct_cause'
                            ? '直接原因'
                            : '根本原因'}
                      </p>
                      <p className="text-sm text-slate-700">{node.label}</p>
                      {node.description && (
                        <p className="text-xs text-slate-500 mt-1">{node.description}</p>
                      )}
                    </div>
                    {index < scenario.knowledge_graph_nodes.filter((n) => ['phenomenon', 'direct_cause', 'root_cause'].includes(n.type)).length - 1 && (
                      <ChevronRight size={16} className="text-slate-300 mt-1" />
                    )}
                  </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-800">
                <span className="font-bold">置信度：</span>
                {((scenario.root_cause_confidence || 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* 知识图谱可视化 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1 overflow-hidden">
            <h2 className="font-bold text-slate-800 mb-3">知识图谱</h2>
            <div className="h-full relative bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
              {/* 简化的知识图谱展示 */}
              <svg width="100%" height="100%" className="absolute inset-0">
                {scenario.knowledge_graph_edges.map((edge) => {
                  const source = scenario.knowledge_graph_nodes.find((n) => n.id === edge.source)
                  const target = scenario.knowledge_graph_nodes.find((n) => n.id === edge.target)
                  if (!source || !target) return null
                  return (
                    <line
                      key={edge.id}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                  </marker>
                </defs>
                {scenario.knowledge_graph_nodes.map((node) => {
                  const nodeColors = {
                    phenomenon: { fill: '#fed7aa', stroke: '#f97316', text: '#c2410c' },
                    direct_cause: { fill: '#fde68a', stroke: '#f59e0b', text: '#b45309' },
                    root_cause: { fill: '#fecaca', stroke: '#ef4444', text: '#b91c1c' },
                  }
                  const colors = nodeColors[node.type as keyof typeof nodeColors] || nodeColors.phenomenon
                  return (
                    <g key={node.id}>
                      <rect
                        x={node.x - 60}
                        y={node.y - 15}
                        width="120"
                        height="30"
                        rx="6"
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth="2"
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="12"
                        fontWeight="500"
                      >
                        {node.label.length > 10 ? `${node.label.slice(0, 10)}...` : node.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* 右侧：方案对比 + 执行 */}
        <div className="w-1/2 p-4 flex flex-col gap-4 overflow-hidden">
          {/* 排序控制 */}
          <div className="flex items-center justify-between flex-shrink-0">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              解决方案对比
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">排序：</span>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[
                  { key: 'cost', label: '成本' },
                  { key: 'time', label: '时间' },
                  { key: 'risk', label: '风险' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortBy(opt.key as 'cost' | 'time' | 'risk')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      sortBy === opt.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 方案列表 */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {getSortedSolutions().map((sol) => (
              <div
                key={sol.id}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                  selectedSolution === sol.id
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedSolution(sol.id)}
              >
                {sol.is_recommended && (
                  <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <Sparkles size={10} />
                    AI 推荐
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800">{sol.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskColor(sol.risk_level)}`}>
                    {getRiskLabel(sol.risk_level)}
                  </span>
                </div>

                {sol.description && (
                  <p className="text-slate-600 text-sm mb-3">{sol.description}</p>
                )}

                <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-slate-500 mb-0.5">维修成本</p>
                    <p className="font-bold text-slate-800">{formatCost(sol.repair_cost)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-slate-500 mb-0.5">交期影响</p>
                    <p className="font-bold text-slate-800">{formatCost(sol.delivery_impact_cost)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-slate-500 mb-0.5">品质风险</p>
                    <p className="font-bold text-slate-800">{formatCost(sol.quality_risk_cost)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-slate-500 mb-0.5">停产损失</p>
                    <p className="font-bold text-slate-800">{formatCost(sol.downtime_cost)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                    <p className="text-red-500 mb-0.5">综合损失</p>
                    <p className="font-bold text-red-600">{formatCost(sol.total_expected_loss)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {formatDuration(sol.implementation_time_hours)}
                    </span>
                    <span className="flex items-center gap-1">
                      {sol.success_rate >= 0.9 ? (
                        <TrendingUp size={12} className="text-green-500" />
                      ) : (
                        <TrendingDown size={12} className="text-amber-500" />
                      )}
                      成功率: {(sol.success_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 执行区域 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-shrink-0">
            {executionPhase === 'select' && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  已选择：<span className="font-medium text-slate-800">
                    {scenario.solutions.find((s) => s.id === selectedSolution)?.title || '未选择'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={!selectedSolution}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={16} />
                  开始模拟执行
                </button>
              </div>
            )}

            {executionPhase === 'executing' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-800">执行中...</span>
                  <span className="text-sm text-blue-600 font-mono">{executionProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${executionProgress}%` }}
                  />
                </div>
                <div className="bg-slate-50 rounded-lg p-3 max-h-24 overflow-y-auto">
                  {executionLogs.map((log, index) => (
                    <p key={index} className="text-xs text-slate-600 font-mono">{log}</p>
                  ))}
                </div>
              </div>
            )}

            {executionPhase === 'completed' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check size={20} className="text-green-500" />
                  <span className="font-medium text-green-700">模拟执行完成</span>
                </div>
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  {executionLogs.slice(-3).map((log, index) => (
                    <p key={index} className="text-xs text-green-700 font-mono">{log}</p>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExecutionPhase('select')
                      setExecutionProgress(0)
                      setExecutionLogs([])
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    重新模拟
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/app/')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    返回 Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Simulation
