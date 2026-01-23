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
