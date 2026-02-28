// frontend/components/FactoryVisualization/factoryData.ts
// 厂区 → 车间 → 产线 → 工位 层级 Mock 数据
// 复用 mockData.ts 中 PRODUCTION_LINES 的 id/name/status/type

export type StatusType = 'running' | 'idle' | 'error'

export interface Station {
  id: string
  name: string
  type: string
  status: StatusType
  cycleTime: number  // 节拍（秒）
  position: number   // 在产线中的顺序
}

export interface WorkshopLine {
  id: string          // 与 PRODUCTION_LINES 中的 id 一致
  name: string
  type: string
  status: StatusType
  oee: number         // 0-100
  currentOrder: string
  stations: Station[]
  gridPos: { col: number; row: number }  // 在车间网格中的位置
}

export interface Workshop {
  id: string
  name: string
  status: StatusType
  lines: WorkshopLine[]
  gridPos: { col: number; row: number }  // 在厂区网格中的位置
}

// SMT 车间工位模板
const SMT_STATIONS: Station[] = [
  { id: 's1', name: '上料', type: '上料机', status: 'running', cycleTime: 15, position: 0 },
  { id: 's2', name: '印刷', type: '印刷机', status: 'running', cycleTime: 25, position: 1 },
  { id: 's3', name: 'SPI', type: '检测机', status: 'running', cycleTime: 20, position: 2 },
  { id: 's4', name: '贴片', type: '贴片机', status: 'running', cycleTime: 45, position: 3 },
  { id: 's5', name: '回流焊', type: '回流焊炉', status: 'running', cycleTime: 180, position: 4 },
  { id: 's6', name: 'AOI', type: 'AOI', status: 'running', cycleTime: 30, position: 5 },
  { id: 's7', name: '分板', type: '分板机', status: 'running', cycleTime: 20, position: 6 },
]

const PCB_STATIONS: Station[] = [
  { id: 'p1', name: '上料', type: '上料机', status: 'running', cycleTime: 12, position: 0 },
  { id: 'p2', name: '钻孔', type: '钻孔机', status: 'running', cycleTime: 60, position: 1 },
  { id: 'p3', name: '沉铜', type: '沉铜线', status: 'running', cycleTime: 120, position: 2 },
  { id: 'p4', name: '图形转移', type: '曝光机', status: 'idle', cycleTime: 40, position: 3 },
  { id: 'p5', name: '蚀刻', type: '蚀刻线', status: 'running', cycleTime: 90, position: 4 },
  { id: 'p6', name: '绿油', type: '涂覆机', status: 'running', cycleTime: 50, position: 5 },
  { id: 'p7', name: '测试', type: '飞针测试', status: 'running', cycleTime: 35, position: 6 },
]

const C3_STATIONS: Station[] = [
  { id: 'c1', name: '来料检', type: 'IQC', status: 'running', cycleTime: 20, position: 0 },
  { id: 'c2', name: '组装', type: '组装机', status: 'running', cycleTime: 55, position: 1 },
  { id: 'c3', name: '螺丝锁付', type: '锁螺丝机', status: 'running', cycleTime: 30, position: 2 },
  { id: 'c4', name: '功能测试', type: '测试治具', status: 'error', cycleTime: 45, position: 3 },
  { id: 'c5', name: '老化', type: '老化炉', status: 'running', cycleTime: 240, position: 4 },
  { id: 'c6', name: '外观检', type: 'OQC', status: 'running', cycleTime: 25, position: 5 },
  { id: 'c7', name: '包装', type: '包装机', status: 'running', cycleTime: 18, position: 6 },
]

export const FACTORY_DATA: Workshop[] = [
  {
    id: 'workshop-smt',
    name: 'SMT 车间',
    status: 'error',  // 因 A03 故障
    gridPos: { col: 0, row: 0 },
    lines: [
      {
        id: 'smt-a01', name: 'SMT A01', type: 'SMT', status: 'running',
        oee: 88.3, currentOrder: 'WO-20260228-001',
        stations: SMT_STATIONS.map(s => ({ ...s, id: `a01-${s.id}` })),
        gridPos: { col: 0, row: 0 },
      },
      {
        id: 'smt-a02', name: 'SMT A02', type: 'SMT', status: 'running',
        oee: 76.5, currentOrder: 'WO-20260228-002',
        stations: SMT_STATIONS.map(s => ({ ...s, id: `a02-${s.id}` })),
        gridPos: { col: 1, row: 0 },
      },
      {
        id: 'smt-a03', name: 'SMT A03', type: 'SMT', status: 'error',
        oee: 52.1, currentOrder: 'WO-20260228-003',
        stations: SMT_STATIONS.map((s, i) => ({
          ...s, id: `a03-${s.id}`,
          status: i === 3 ? 'error' : s.status,  // 贴片机故障
        })),
        gridPos: { col: 2, row: 0 },
      },
    ],
  },
  {
    id: 'workshop-pcb',
    name: 'PCB 车间',
    status: 'running',
    gridPos: { col: 1, row: 0 },
    lines: [
      {
        id: 'pcb-b01', name: 'PCB B01', type: 'PCB', status: 'running',
        oee: 94.2, currentOrder: 'WO-20260228-004',
        stations: PCB_STATIONS.map(s => ({ ...s, id: `b01-${s.id}` })),
        gridPos: { col: 0, row: 0 },
      },
      {
        id: 'pcb-b02', name: 'PCB B02', type: 'PCB', status: 'idle',
        oee: 0, currentOrder: '—',
        stations: PCB_STATIONS.map(s => ({ ...s, id: `b02-${s.id}`, status: 'idle' as StatusType })),
        gridPos: { col: 1, row: 0 },
      },
      {
        id: 'pcb-b03', name: 'PCB B03', type: 'PCB', status: 'running',
        oee: 91.0, currentOrder: 'WO-20260228-005',
        stations: PCB_STATIONS.map(s => ({ ...s, id: `b03-${s.id}` })),
        gridPos: { col: 2, row: 0 },
      },
    ],
  },
  {
    id: 'workshop-3c',
    name: '3C 车间',
    status: 'error',  // 因 C03 故障
    gridPos: { col: 2, row: 0 },
    lines: [
      {
        id: '3c-c01', name: '3C C01', type: '3C', status: 'running',
        oee: 85.7, currentOrder: 'WO-20260228-006',
        stations: C3_STATIONS.map(s => ({ ...s, id: `c01-${s.id}` })),
        gridPos: { col: 0, row: 0 },
      },
      {
        id: '3c-c02', name: '3C C02', type: '3C', status: 'running',
        oee: 83.2, currentOrder: 'WO-20260228-007',
        stations: C3_STATIONS.map(s => ({ ...s, id: `c02-${s.id}` })),
        gridPos: { col: 1, row: 0 },
      },
      {
        id: '3c-c03', name: '3C C03', type: '3C', status: 'error',
        oee: 61.3, currentOrder: 'WO-20260228-008',
        stations: C3_STATIONS.map((s, i) => ({
          ...s, id: `c03-${s.id}`,
          status: i === 3 ? 'error' : s.status,  // 功能测试故障
        })),
        gridPos: { col: 2, row: 0 },
      },
    ],
  },
]

// 状态色映射
export const STATUS_COLORS: Record<StatusType, { top: string; left: string; right: string; text: string; pulse: string }> = {
  running: { top: '#dcfce7', left: '#86efac', right: '#bbf7d0', text: '#15803d', pulse: '#22c55e' },
  idle:    { top: '#fef9c3', left: '#fde047', right: '#fef08a', text: '#854d0e', pulse: '#eab308' },
  error:   { top: '#fee2e2', left: '#fca5a5', right: '#fecaca', text: '#991b1b', pulse: '#ef4444' },
}
