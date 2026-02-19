export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  path: string
  group?: string // 功能分组
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export interface Metric {
  label: string
  value: string
  trend: number // percentage
  trendLabel: string
}

export interface Capability {
  id: string
  title: string
  description: string
  category: 'Vision' | 'Optimization' | 'Data' | 'Simulation'
  price: string
  subscribed: boolean
  iconName: string
}

export interface Node {
  id: string
  type: string
  x: number
  y: number
  label: string
}

export interface Connection {
  from: string
  to: string
}

// New Types for Production Dashboard
export interface ProductionData {
  time: string
  planned: number
  actual: number
}

export interface AlertItem {
  id: string
  time: string
  level: 'warning' | 'error' | 'critical'
  location: string
  message: string
}

export interface SolutionOption {
  id: string
  title: string
  type: 'recommended' | 'alternative'
  description: string
  duration: string
  risk: 'low' | 'medium' | 'high'
}

// New Types for Tianchou Optimization
export interface TaskItem {
  id: string
  name: string
  resource: string
  start: number // minutes from 08:00
  duration: number
  status: 'baseline' | 'optimized' | 'bottleneck' | 'drift'
}

export type AssetMode = 'light' | 'heavy'

export interface EconomicMetric {
  label: string
  cost: number
  risk: number
  gain: number
}

// ==================== 阶段一：新增类型定义 ====================

// 产线类型
export interface ProductionLine {
  id: string
  name: string // 例如: "SMT智能产线A01"
  type: 'SMT' | 'PCB' | '3C'
  status: 'running' | 'idle' | 'error'
}

// Dashboard 数据看板
export interface DashboardMetrics {
  completionRate: number // 当日计划完成率
  actualProduction: number // 实际生产数
  plannedProduction: number // 计划生产数
  attendance: number // 出勤人数
  efficiency: number // 工时效率
  outputValue: number // 产值（单位：万元）
}

// 异常信息扩展
export interface AnomalyDetail extends AlertItem {
  lineType: 'SMT' | 'PCB' | '3C' // 所属产线类型
  description: string // 详细描述
  rootCause?: string // 根本原因
  solutions?: string[] // 可能解决方案
}

// 知识图谱节点
export interface KnowledgeNode {
  id: string
  type: 'phenomenon' | 'cause' | 'solution'
  label: string
  description: string
  x?: number // D3布局计算后的坐标
  y?: number
}

// 知识图谱关系
export interface KnowledgeEdge {
  id: string
  source: string // 节点ID
  target: string // 节点ID
  type: 'leads_to' | 'caused_by' | 'solved_by'
  label?: string
}

// 知识图谱完整数据
export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  anomalyId: string // 关联的异常ID
}

// 天筹决策结果
export interface OptimizationResult {
  anomalyId: string
  phenomenon: string // 现象描述
  rootCauses: string[] // 原因列表
  solutions: SolutionOption[] // 解决方案
  estimatedRepairTime: { min: number; max: number } // 预计维修时长（分钟）
  successRate: number // 修复成功概率 (0-100)
  continuousProductionRisk: number // 继续生产的流出风险 (0-100)
  shutdownImpact: { delay: number; unit: 'hour' | 'day' } // 停线对交付影响
  remedialActions?: string[] // 补救方案
}

// 浑天仿真配置
export interface SimulationConfig {
  type: 'device_rearrangement' | 'route_optimization' // 仿真类型
  duration: number // 仿真时长（小时）
  speed: 1 | 10 | 100 // 播放倍速
}

// 设备重排动画数据
export interface DeviceMove {
  deviceId: string
  fromPosition: { x: number; y: number }
  toPosition: { x: number; y: number }
  duration: number // 动画持续时间（毫秒）
}

// 线路优化动画数据
export interface RouteOptimization {
  routeId: string
  oldPath: { x: number; y: number }[]
  newPath: { x: number; y: number }[]
  duration: number
}

// ==================== 浑天仿真可视化类型 ====================

// 区域定义
export interface Zone {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  color: string
  borderColor?: string
  textColor?: string
}

// 设备/机器定义（轻工业）
export interface Machine {
  id: string
  label: string
  type: string
  subLabel?: string
  original: { x: number; y: number }
  optimized: { x: number; y: number }
  width: number
  height: number
}

// 产品线/物料流线
export interface ProductLine {
  id: string
  name: string
  color: string
  path: { x: number; y: number }[]
}

// AGV 路径节点
export interface AGVNode {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  label: string
}

// AGV 路径
export interface AGVRouteData {
  id: string
  name: string
  color: string
  pathOriginal: { x: number; y: number }[]
  pathOptimized: { x: number; y: number }[]
}

// 轻工业指标
export interface TextileMetrics {
  materialCost: number
  moveCost: number
  movedCount: number
  totalDistance: number
}

// 重工业指标
export interface AutoMetrics {
  maxTime: number
  bottleneckRate: number
  loadBalance: string
  totalDistance: number
  agvUsage: string
}
