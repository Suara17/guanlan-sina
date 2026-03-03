/**
 * 浑天仿真可视化常量数据
 * 包含轻工业（设备布局）和重工业（AGV路径）场景的数据
 */

import type {
  AGVNode,
  AGVRouteData,
  AutoMetrics,
  Machine,
  ProductLine,
  TextileMetrics,
  Zone,
} from './types'

// ==================== 轻工业场景（设备布局优化）====================

// 区域定义
export const TEXTILE_ZONES: Zone[] = [
  {
    id: 'storage',
    x: 0,
    y: 0,
    width: 25,
    height: 60,
    label: '物料存储区',
    color: '#e0f2fe',
    borderColor: '#0ea5e9',
    textColor: '#0369a1',
  },
  {
    id: 'quality',
    x: 55,
    y: 0,
    width: 25,
    height: 30,
    label: '质检区',
    color: '#fef3c7',
    borderColor: '#d97706',
    textColor: '#92400e',
  },
  {
    id: 'loading',
    x: 55,
    y: 30,
    width: 25,
    height: 30,
    label: '装货区',
    color: '#dcfce7',
    borderColor: '#16a34a',
    textColor: '#166534',
  },
  {
    id: 'packaging',
    x: 25,
    y: 45,
    width: 30,
    height: 15,
    label: '包装区',
    color: '#ffe4e6',
    borderColor: '#f43f5e',
    textColor: '#be123c',
  },
]

// 设备/机器定义
export const TEXTILE_MACHINES: Machine[] = [
  {
    id: 'm1',
    label: 'M1',
    type: '纺纱机',
    subLabel: '高速型',
    original: { x: 20, y: 8 },
    optimized: { x: 22, y: 8 },
    width: 7,
    height: 5,
  },
  {
    id: 'm2',
    label: 'M2',
    type: '织布机',
    subLabel: '标准型',
    original: { x: 30, y: 8 },
    optimized: { x: 31, y: 10 },
    width: 7,
    height: 5,
  },
  {
    id: 'm3',
    label: 'M3',
    type: '染色机',
    subLabel: '连续式',
    original: { x: 40, y: 8 },
    optimized: { x: 39, y: 9 },
    width: 7,
    height: 5,
  },
  {
    id: 'm4',
    label: 'M4',
    type: '烘干机',
    subLabel: '热风型',
    original: { x: 50, y: 8 },
    optimized: { x: 47, y: 9 },
    width: 7,
    height: 5,
  },
  {
    id: 'm5',
    label: 'M5',
    type: '裁剪机',
    subLabel: '自动化',
    original: { x: 60, y: 8 },
    optimized: { x: 55, y: 10 },
    width: 7,
    height: 5,
  },
  {
    id: 'm6',
    label: 'M6',
    type: '缝纫机',
    subLabel: '双针型',
    original: { x: 20, y: 18 },
    optimized: { x: 24, y: 17 },
    width: 7,
    height: 5,
  },
  {
    id: 'm7',
    label: 'M7',
    type: '包装机',
    subLabel: '高速封装',
    original: { x: 30, y: 18 },
    optimized: { x: 33, y: 18 },
    width: 7,
    height: 5,
  },
  {
    id: 'm8',
    label: 'M8',
    type: '质检仪',
    subLabel: '视觉检测',
    original: { x: 40, y: 18 },
    optimized: { x: 42, y: 19 },
    width: 7,
    height: 5,
  },
  {
    id: 'm9',
    label: 'M9',
    type: '储料机',
    subLabel: '缓存仓',
    original: { x: 50, y: 18 },
    optimized: { x: 49, y: 20 },
    width: 7,
    height: 5,
  },
  {
    id: 'm10',
    label: 'M10',
    type: '转运台',
    subLabel: 'AGV对接',
    original: { x: 60, y: 18 },
    optimized: { x: 57, y: 21 },
    width: 7,
    height: 5,
  },
  {
    id: 'm11',
    label: 'M11',
    type: '纺纱机',
    subLabel: '标准型',
    original: { x: 20, y: 28 },
    optimized: { x: 22, y: 27 },
    width: 7,
    height: 5,
  },
  {
    id: 'm12',
    label: 'M12',
    type: '包装机',
    subLabel: '自动码垛',
    original: { x: 30, y: 28 },
    optimized: { x: 30, y: 30 },
    width: 7,
    height: 5,
  },
  {
    id: 'm13',
    label: 'M13',
    type: '染色机',
    subLabel: '节能型',
    original: { x: 40, y: 28 },
    optimized: { x: 38, y: 31 },
    width: 7,
    height: 5,
  },
  {
    id: 'm14',
    label: 'M14',
    type: '烘干机',
    subLabel: '循环式',
    original: { x: 50, y: 28 },
    optimized: { x: 47, y: 32 },
    width: 7,
    height: 5,
  },
  {
    id: 'm15',
    label: 'M15',
    type: '裁剪机',
    subLabel: '精密型',
    original: { x: 60, y: 28 },
    optimized: { x: 54, y: 33 },
    width: 7,
    height: 5,
  },
  {
    id: 'm16',
    label: 'M16',
    type: '缝纫机',
    subLabel: '多针型',
    original: { x: 20, y: 38 },
    optimized: { x: 24, y: 37 },
    width: 7,
    height: 5,
  },
  {
    id: 'm17',
    label: 'M17',
    type: '织布机',
    subLabel: '高速型',
    original: { x: 30, y: 38 },
    optimized: { x: 33, y: 40 },
    width: 7,
    height: 5,
  },
  {
    id: 'm18',
    label: 'M18',
    type: '质检仪',
    subLabel: 'AI检测',
    original: { x: 40, y: 38 },
    optimized: { x: 42, y: 42 },
    width: 7,
    height: 5,
  },
  {
    id: 'm19',
    label: 'M19',
    type: '储料机',
    subLabel: '周转仓',
    original: { x: 50, y: 38 },
    optimized: { x: 51, y: 41 },
    width: 7,
    height: 5,
  },
  {
    id: 'm20',
    label: 'M20',
    type: '转运台',
    subLabel: '智能调度',
    original: { x: 60, y: 38 },
    optimized: { x: 58, y: 43 },
    width: 7,
    height: 5,
  },
]

// 产品线/物料流线
export const TEXTILE_PRODUCT_LINES: ProductLine[] = [
  {
    id: 'line1',
    name: '产品线A',
    color: '#3b82f6',
    path: [
      { x: 5, y: 12 },
      { x: 80, y: 12 },
    ],
  },
  {
    id: 'line2',
    name: '产品线B',
    color: '#6366f1',
    path: [
      { x: 5, y: 20 },
      { x: 80, y: 20 },
    ],
  },
  {
    id: 'line3',
    name: '产品线C',
    color: '#06b6d4',
    path: [
      { x: 5, y: 30 },
      { x: 80, y: 30 },
    ],
  },
  {
    id: 'line4',
    name: '产品线D',
    color: '#8b5cf6',
    path: [
      { x: 5, y: 40 },
      { x: 80, y: 40 },
    ],
  },
  {
    id: 'line5',
    name: '产品线E',
    color: '#14b8a6',
    path: [
      { x: 5, y: 48 },
      { x: 80, y: 48 },
    ],
  },
]

// 轻工业指标 - 原始
export const TEXTILE_METRICS_ORIGINAL: TextileMetrics = {
  materialCost: 68400,
  moveCost: 0,
  movedCount: 0,
  totalDistance: 0,
}

// 轻工业指标 - 优化后
export const TEXTILE_METRICS_OPTIMIZED: TextileMetrics = {
  materialCost: 53560,
  moveCost: 29400,
  movedCount: 20,
  totalDistance: 186,
}

// ==================== 重工业场景（AGV路径优化）====================

// 区域定义
export const AUTO_ZONES: Zone[] = [
  {
    id: 'warehouse',
    x: 0,
    y: 0,
    width: 25,
    height: 40,
    label: '原材料仓库',
    color: '#dbeafe',
    borderColor: '#2563eb',
  },
  {
    id: 'assembly',
    x: 30,
    y: 0,
    width: 20,
    height: 35,
    label: '装配区',
    color: '#fef3c7',
    borderColor: '#d97706',
  },
  {
    id: 'welding',
    x: 55,
    y: 0,
    width: 25,
    height: 35,
    label: '焊接区',
    color: '#fee2e2',
    borderColor: '#dc2626',
  },
  {
    id: 'painting',
    x: 0,
    y: 45,
    width: 25,
    height: 35,
    label: '涂装区',
    color: '#f3e8ff',
    borderColor: '#9333ea',
  },
  {
    id: 'quality',
    x: 30,
    y: 40,
    width: 20,
    height: 40,
    label: '质检区',
    color: '#dcfce7',
    borderColor: '#16a34a',
  },
  {
    id: 'shipping',
    x: 55,
    y: 40,
    width: 25,
    height: 40,
    label: '发货区',
    color: '#e0f2fe',
    borderColor: '#0284c7',
  },
]

// AGV 工位节点
export const AUTO_NODES: AGVNode[] = [
  { id: 'n1', x: 10, y: 15, label: '上料口 1' },
  { id: 'n2', x: 10, y: 35, label: '上料口 2' },
  { id: 'n3', x: 40, y: 12, label: '装配台 A' },
  { id: 'n4', x: 40, y: 28, label: '装配台 B' },
  { id: 'n5', x: 65, y: 15, label: '焊接站 1' },
  { id: 'n6', x: 65, y: 28, label: '焊接站 2' },
  { id: 'n7', x: 10, y: 58, label: '涂装线 入' },
  { id: 'n8', x: 10, y: 72, label: '涂装线 出' },
  { id: 'n9', x: 40, y: 55, label: '质检台 A' },
  { id: 'n10', x: 40, y: 72, label: '质检台 B' },
  { id: 'n11', x: 65, y: 55, label: '发货口 1' },
  { id: 'n12', x: 65, y: 72, label: '发货口 2' },
  { id: 'agv1', x: 25, y: 40, width: 4, height: 4, label: 'AGV 停靠点 1' },
  { id: 'agv2', x: 55, y: 40, width: 4, height: 4, label: 'AGV 停靠点 2' },
]

// AGV 路径
export const AUTO_ROUTES: AGVRouteData[] = [
  {
    id: 'r1',
    name: 'AGV-1 路径',
    color: '#3b82f6',
    pathOriginal: [
      { x: 10, y: 15 },
      { x: 25, y: 40 },
      { x: 40, y: 12 },
      { x: 55, y: 40 },
      { x: 65, y: 15 },
      { x: 65, y: 55 },
    ],
    pathOptimized: [
      { x: 10, y: 15 },
      { x: 25, y: 20 },
      { x: 40, y: 12 },
      { x: 55, y: 20 },
      { x: 65, y: 15 },
      { x: 65, y: 55 },
    ],
  },
  {
    id: 'r2',
    name: 'AGV-2 路径',
    color: '#10b981',
    pathOriginal: [
      { x: 10, y: 35 },
      { x: 25, y: 40 },
      { x: 40, y: 28 },
      { x: 55, y: 40 },
      { x: 65, y: 28 },
      { x: 65, y: 72 },
    ],
    pathOptimized: [
      { x: 10, y: 35 },
      { x: 25, y: 35 },
      { x: 40, y: 28 },
      { x: 55, y: 35 },
      { x: 65, y: 28 },
      { x: 65, y: 72 },
    ],
  },
  {
    id: 'r3',
    name: 'AGV-3 路径',
    color: '#f59e0b',
    pathOriginal: [
      { x: 10, y: 58 },
      { x: 25, y: 40 },
      { x: 40, y: 55 },
      { x: 55, y: 40 },
      { x: 65, y: 55 },
    ],
    pathOptimized: [
      { x: 10, y: 58 },
      { x: 25, y: 55 },
      { x: 40, y: 55 },
      { x: 55, y: 55 },
      { x: 65, y: 55 },
    ],
  },
]

// 重工业指标 - 原始
export const AUTO_METRICS_ORIGINAL: AutoMetrics = {
  maxTime: 8.2,
  bottleneckRate: 95,
  loadBalance: '0.68',
  totalDistance: 1850,
  agvUsage: '3/3',
}

// 重工业指标 - 优化后
export const AUTO_METRICS_OPTIMIZED: AutoMetrics = {
  maxTime: 6.1,
  bottleneckRate: 78,
  loadBalance: '0.92',
  totalDistance: 1420,
  agvUsage: '3/3',
}
