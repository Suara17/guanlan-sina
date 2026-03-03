# 厂区-生产线 2.5D 动态可视化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在生产可视化首页（`/app/`）新增"厂区动态图"卡片区域，提供厂区→车间→产线三级点击下钻的等轴测 2.5D 动态图，含物料流动动画、设备状态色和实时数据占位提示。

**Architecture:** 纯 SVG + CSS transform 等轴测投影（Isometric），用 Framer Motion 驱动层级切换和粒子动画。组件树为 `FactoryVisualization/index.tsx`（层级状态）→ `FactoryView` / `WorkshopView` / `ProductionLineView`，基础砖块由 `IsometricBlock.tsx` 复用。复用 `mockData.ts` 中的 `PRODUCTION_LINES`，在 `factoryData.ts` 中扩展车间和工位层级数据。

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS, Framer Motion (已安装), SVG, lucide-react

---

## 背景知识：等轴测投影

等轴测（Isometric）投影把网格坐标 `(col, row)` 映射到屏幕坐标：

```
screenX = (col - row) * (TILE_W / 2)
screenY = (col + row) * (TILE_H / 2)
```

每个"块"由三个 SVG polygon 拼成：
- **顶面**：菱形，填状态色
- **左面**：平行四边形，填暗色（× 0.7）
- **右面**：平行四边形，填中间色（× 0.85）

---

## Task 1: 扩展 Mock 数据（factoryData.ts）

**Files:**
- Create: `frontend/components/FactoryVisualization/factoryData.ts`

**Step 1: 创建文件**

```typescript
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
```

**Step 2: 验证文件存在**

```bash
ls frontend/components/FactoryVisualization/
```
期望：看到 `factoryData.ts`

**Step 3: Commit**

```bash
git add frontend/components/FactoryVisualization/factoryData.ts
git commit -m "feat(factory-vis): add factory hierarchy mock data"
```

---

## Task 2: IsometricBlock 基础组件

**Files:**
- Create: `frontend/components/FactoryVisualization/IsometricBlock.tsx`

**Step 1: 创建等轴测方块基础组件**

```tsx
// frontend/components/FactoryVisualization/IsometricBlock.tsx
// 等轴测方块：三面体（顶/左/右）+ 可选状态脉冲点 + 点击回调
import { motion } from 'framer-motion'
import type React from 'react'
import type { StatusType } from './factoryData'
import { STATUS_COLORS } from './factoryData'

export const TILE_W = 120  // 等轴测砖块宽度（像素）
export const TILE_H = 60   // 等轴测砖块高度（像素）
export const BLOCK_DEPTH = 36  // 方块厚度

/** 将网格坐标转换为 SVG 屏幕坐标 */
export function isoToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

interface IsometricBlockProps {
  col: number
  row: number
  status: StatusType
  label: string
  subLabel?: string
  onClick?: () => void
  /** 是否显示状态脉冲圆点 */
  showPulse?: boolean
  /** 缩放比例（用于不同层级的尺寸调整）*/
  scale?: number
}

const IsometricBlock: React.FC<IsometricBlockProps> = ({
  col,
  row,
  status,
  label,
  subLabel,
  onClick,
  showPulse = true,
  scale = 1,
}) => {
  const colors = STATUS_COLORS[status]
  const { x, y } = isoToScreen(col, row)
  const w = TILE_W * scale
  const h = TILE_H * scale
  const d = BLOCK_DEPTH * scale

  // 顶面：菱形四个顶点
  const topPoints = [
    `${x},${y - d}`,           // 上
    `${x + w / 2},${y + h / 2 - d}`,  // 右
    `${x},${y + h - d}`,       // 下
    `${x - w / 2},${y + h / 2 - d}`,  // 左
  ].join(' ')

  // 左面：平行四边形
  const leftPoints = [
    `${x - w / 2},${y + h / 2 - d}`,
    `${x},${y + h - d}`,
    `${x},${y + h}`,
    `${x - w / 2},${y + h / 2}`,
  ].join(' ')

  // 右面：平行四边形
  const rightPoints = [
    `${x + w / 2},${y + h / 2 - d}`,
    `${x},${y + h - d}`,
    `${x},${y + h}`,
    `${x + w / 2},${y + h / 2}`,
  ].join(' ')

  return (
    <motion.g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 右面 */}
      <polygon points={rightPoints} fill={colors.right} stroke="white" strokeWidth={0.5} />
      {/* 左面 */}
      <polygon points={leftPoints} fill={colors.left} stroke="white" strokeWidth={0.5} />
      {/* 顶面 */}
      <polygon points={topPoints} fill={colors.top} stroke="white" strokeWidth={0.5} />

      {/* 主标签（顶面中心）*/}
      <text
        x={x}
        y={y + h / 2 - d - 4}
        textAnchor="middle"
        fontSize={11 * scale}
        fontWeight="700"
        fill={colors.text}
      >
        {label}
      </text>

      {/* 副标签 */}
      {subLabel && (
        <text
          x={x}
          y={y + h / 2 - d + 10 * scale}
          textAnchor="middle"
          fontSize={9 * scale}
          fill={colors.text}
          opacity={0.75}
        >
          {subLabel}
        </text>
      )}

      {/* 状态脉冲点（右上角）*/}
      {showPulse && (
        <>
          <circle
            cx={x + w / 2 - 8 * scale}
            cy={y - d + 8 * scale}
            r={5 * scale}
            fill={colors.pulse}
            opacity={0.3}
          >
            <animate attributeName="r" values={`${4 * scale};${8 * scale};${4 * scale}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle
            cx={x + w / 2 - 8 * scale}
            cy={y - d + 8 * scale}
            r={4 * scale}
            fill={colors.pulse}
          />
        </>
      )}
    </motion.g>
  )
}

export default IsometricBlock
```

**Step 2: 验证文件**

```bash
ls frontend/components/FactoryVisualization/
```

**Step 3: Commit**

```bash
git add frontend/components/FactoryVisualization/IsometricBlock.tsx
git commit -m "feat(factory-vis): add IsometricBlock base component"
```

---

## Task 3: MaterialParticle 物料流动粒子

**Files:**
- Create: `frontend/components/FactoryVisualization/MaterialParticle.tsx`

**Step 1: 创建粒子动画组件**

```tsx
// frontend/components/FactoryVisualization/MaterialParticle.tsx
// 沿路径流动的物料粒子，用 SVG animateMotion 实现
import type React from 'react'

interface MaterialParticleProps {
  /** SVG path d 属性字符串，粒子沿此路径运动 */
  pathD: string
  color: string
  /** 动画时长（秒）*/
  duration: number
  /** 动画延迟（秒），用于错开多个粒子 */
  delay: number
  /** 路径 id，需全局唯一 */
  pathId: string
}

const MaterialParticle: React.FC<MaterialParticleProps> = ({
  pathD,
  color,
  duration,
  delay,
  pathId,
}) => (
  <>
    {/* 隐藏路径（供 animateMotion 引用）*/}
    <path id={pathId} d={pathD} fill="none" stroke="none" />

    {/* 流动粒子 */}
    <circle r={4} fill={color} opacity={0.85}>
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        rotate="auto"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;0.85;0.85;0"
        keyTimes="0;0.1;0.9;1"
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  </>
)

export default MaterialParticle
```

**Step 2: Commit**

```bash
git add frontend/components/FactoryVisualization/MaterialParticle.tsx
git commit -m "feat(factory-vis): add MaterialParticle SVG animation component"
```

---

## Task 4: FactoryView — 厂区全览（Level 0）

**Files:**
- Create: `frontend/components/FactoryVisualization/FactoryView.tsx`

**Step 1: 创建厂区全览视图**

```tsx
// frontend/components/FactoryVisualization/FactoryView.tsx
// Level 0：3 个车间等轴测全览，点击进入车间
import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import type { Workshop } from './factoryData'
import IsometricBlock, { isoToScreen, TILE_H, TILE_W } from './IsometricBlock'

interface FactoryViewProps {
  workshops: Workshop[]
  onDrillDown: (workshop: Workshop) => void
}

// 计算所有方块占据的 SVG 画布尺寸
const SVG_WIDTH = 860
const SVG_HEIGHT = 320
// 画布中心偏移
const OFFSET_X = SVG_WIDTH / 2
const OFFSET_Y = 80

const FactoryView: React.FC<FactoryViewProps> = ({ workshops, onDrillDown }) => {
  // 统计全厂状态
  const totalLines = workshops.reduce((n, w) => n + w.lines.length, 0)
  const errorLines = workshops.reduce(
    (n, w) => n + w.lines.filter((l) => l.status === 'error').length,
    0,
  )
  const runningLines = workshops.reduce(
    (n, w) => n + w.lines.filter((l) => l.status === 'running').length,
    0,
  )

  return (
    <div className="flex flex-col gap-3">
      {/* 全厂汇总指标行 */}
      <div className="flex gap-4 px-1">
        <span className="text-xs text-slate-500">
          产线总数 <span className="font-bold text-slate-700">{totalLines}</span>
        </span>
        <span className="text-xs text-slate-500">
          运行中 <span className="font-bold text-green-600">{runningLines}</span>
        </span>
        <span className="text-xs text-slate-500">
          故障 <span className="font-bold text-red-500">{errorLines}</span>
        </span>
        <span className="text-xs text-amber-600 ml-auto">点击车间查看详情 →</span>
      </div>

      {/* 等轴测 SVG */}
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="overflow-visible"
        style={{ maxHeight: 280 }}
      >
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
          <AnimatePresence>
            {workshops.map((workshop) => {
              const { col, row } = workshop.gridPos
              // 车间块比产线块大 1.8 倍
              const { x, y } = isoToScreen(col, row)
              const errorCount = workshop.lines.filter((l) => l.status === 'error').length

              return (
                <IsometricBlock
                  key={workshop.id}
                  col={col * 1.2}
                  row={row}
                  status={workshop.status}
                  label={workshop.name}
                  subLabel={errorCount > 0 ? `⚠ ${errorCount} 条产线异常` : `${workshop.lines.length} 条产线`}
                  onClick={() => onDrillDown(workshop)}
                  scale={1.8}
                  showPulse={workshop.status !== 'running'}
                />
              )
            })}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  )
}

export default FactoryView
```

**Step 2: Commit**

```bash
git add frontend/components/FactoryVisualization/FactoryView.tsx
git commit -m "feat(factory-vis): add FactoryView Level-0 isometric overview"
```

---

## Task 5: WorkshopView — 车间视图（Level 1）

**Files:**
- Create: `frontend/components/FactoryVisualization/WorkshopView.tsx`

**Step 1: 创建车间视图**

```tsx
// frontend/components/FactoryVisualization/WorkshopView.tsx
// Level 1：车间内 3 条产线，等轴测排列，含物料流粒子
import { AnimatePresence } from 'framer-motion'
import type React from 'react'
import type { WorkshopLine } from './factoryData'
import IsometricBlock, { isoToScreen, TILE_H, TILE_W } from './IsometricBlock'
import MaterialParticle from './MaterialParticle'

interface WorkshopViewProps {
  lines: WorkshopLine[]
  workshopName: string
  onDrillDown: (line: WorkshopLine) => void
}

const SVG_WIDTH = 860
const SVG_HEIGHT = 300
const OFFSET_X = SVG_WIDTH / 2
const OFFSET_Y = 90

const WorkshopView: React.FC<WorkshopViewProps> = ({ lines, workshopName, onDrillDown }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 px-1">
        <span className="text-xs font-semibold text-slate-600">{workshopName}</span>
        {lines.map((line) => (
          <span key={line.id} className="text-xs text-slate-500">
            {line.name}：
            <span
              className={
                line.status === 'running'
                  ? 'text-green-600 font-bold'
                  : line.status === 'error'
                    ? 'text-red-500 font-bold'
                    : 'text-amber-500 font-bold'
              }
            >
              OEE {line.oee > 0 ? `${line.oee}%` : '—'}
            </span>
          </span>
        ))}
        <span className="text-xs text-amber-600 ml-auto">点击产线查看详情 →</span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="overflow-visible"
        style={{ maxHeight: 260 }}
      >
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
          <AnimatePresence>
            {lines.map((line, i) => {
              // 产线纵向排列，col 固定，row 递增
              const col = 0
              const row = i * 1.3

              return (
                <IsometricBlock
                  key={line.id}
                  col={col}
                  row={row}
                  status={line.status}
                  label={line.name}
                  subLabel={line.currentOrder !== '—' ? `工单 ${line.currentOrder.slice(-3)}` : '待机'}
                  onClick={() => onDrillDown(line)}
                  scale={1.4}
                  showPulse={line.status !== 'running'}
                />
              )
            })}
          </AnimatePresence>

          {/* 产线间物料流粒子：从上一条产线流向下一条 */}
          {lines.slice(0, -1).map((line, i) => {
            const fromIso = isoToScreen(0, i * 1.3)
            const toIso = isoToScreen(0, (i + 1) * 1.3)
            const pathId = `ws-flow-${line.id}-${i}`
            const pathD = `M ${fromIso.x} ${fromIso.y + TILE_H * 1.4} L ${toIso.x} ${toIso.y}`

            return (
              <MaterialParticle
                key={pathId}
                pathId={pathId}
                pathD={pathD}
                color={line.status === 'error' ? '#ef4444' : '#22c55e'}
                duration={1.8}
                delay={i * 0.6}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export default WorkshopView
```

**Step 2: Commit**

```bash
git add frontend/components/FactoryVisualization/WorkshopView.tsx
git commit -m "feat(factory-vis): add WorkshopView Level-1 with material particles"
```

---

## Task 6: ProductionLineView — 产线详情（Level 2）

**Files:**
- Create: `frontend/components/FactoryVisualization/ProductionLineView.tsx`

**Step 1: 创建产线详情视图**

```tsx
// frontend/components/FactoryVisualization/ProductionLineView.tsx
// Level 2：产线工位等轴测展示，含传送带粒子、节拍信息、实时数据占位提示
import { AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import type React from 'react'
import type { WorkshopLine } from './factoryData'
import IsometricBlock, { isoToScreen, TILE_H, TILE_W } from './IsometricBlock'
import MaterialParticle from './MaterialParticle'

interface ProductionLineViewProps {
  line: WorkshopLine
}

const SVG_WIDTH = 860
const SVG_HEIGHT = 260
const OFFSET_X = 80
const OFFSET_Y = 120

const ProductionLineView: React.FC<ProductionLineViewProps> = ({ line }) => {
  const bottleneck = [...line.stations].sort((a, b) => b.cycleTime - a.cycleTime)[0]

  return (
    <div className="flex flex-col gap-3">
      {/* 产线汇总信息 */}
      <div className="flex gap-4 px-1 flex-wrap">
        <span className="text-xs font-semibold text-slate-600">{line.name}</span>
        <span className="text-xs text-slate-500">
          工单 <span className="font-mono font-bold text-slate-700">{line.currentOrder}</span>
        </span>
        <span className="text-xs text-slate-500">
          OEE <span className="font-bold text-blue-600">{line.oee > 0 ? `${line.oee}%` : '—'}</span>
        </span>
        <span className="text-xs text-slate-500">
          瓶颈工位 <span className="font-bold text-orange-500">{bottleneck.name}（{bottleneck.cycleTime}s）</span>
        </span>
      </div>

      {/* 等轴测工位 SVG */}
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="overflow-visible"
        style={{ maxHeight: 220 }}
      >
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
          <AnimatePresence>
            {line.stations.map((station, i) => (
              <IsometricBlock
                key={station.id}
                col={i * 1.1}
                row={0}
                status={station.status}
                label={station.name}
                subLabel={`${station.cycleTime}s`}
                scale={0.95}
                showPulse={station.status !== 'running'}
              />
            ))}
          </AnimatePresence>

          {/* 工位间传送带粒子 */}
          {line.stations.slice(0, -1).map((station, i) => {
            const from = isoToScreen(i * 1.1, 0)
            const to = isoToScreen((i + 1) * 1.1, 0)
            const pathId = `pl-flow-${line.id}-${i}`
            const pathD = `M ${from.x + TILE_W * 0.95 / 2} ${from.y} L ${to.x - TILE_W * 0.95 / 2} ${to.y}`

            return (
              <MaterialParticle
                key={pathId}
                pathId={pathId}
                pathD={pathD}
                color={station.status === 'error' ? '#ef4444' : '#3b82f6'}
                duration={1.2}
                delay={i * 0.15}
              />
            )
          })}
        </g>
      </svg>

      {/* 实时数据占位提示 */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          <strong>数据来源：仿真测试数据</strong>
          &nbsp;— 接入实时数据后，此处将显示设备实际运行状态、节拍数据与异常告警。
        </span>
      </div>
    </div>
  )
}

export default ProductionLineView
```

**Step 2: Commit**

```bash
git add frontend/components/FactoryVisualization/ProductionLineView.tsx
git commit -m "feat(factory-vis): add ProductionLineView Level-2 with stations and placeholder"
```

---

## Task 7: FactoryVisualization 主容器（层级管理 + 面包屑）

**Files:**
- Create: `frontend/components/FactoryVisualization/index.tsx`

**Step 1: 创建主容器**

```tsx
// frontend/components/FactoryVisualization/index.tsx
// 主容器：管理厂区 → 车间 → 产线三级下钻状态，面包屑导航
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Factory } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { Workshop, WorkshopLine } from './factoryData'
import { FACTORY_DATA } from './factoryData'
import FactoryView from './FactoryView'
import ProductionLineView from './ProductionLineView'
import WorkshopView from './WorkshopView'

type Level = 'factory' | 'workshop' | 'line'

const FactoryVisualization: React.FC = () => {
  const [level, setLevel] = useState<Level>('factory')
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [selectedLine, setSelectedLine] = useState<WorkshopLine | null>(null)

  const handleDrillToWorkshop = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setLevel('workshop')
  }

  const handleDrillToLine = (line: WorkshopLine) => {
    setSelectedLine(line)
    setLevel('line')
  }

  const handleBreadcrumb = (target: Level) => {
    setLevel(target)
    if (target === 'factory') {
      setSelectedWorkshop(null)
      setSelectedLine(null)
    } else if (target === 'workshop') {
      setSelectedLine(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">厂区动态图</span>
        </div>

        {/* 面包屑 */}
        <nav className="flex items-center gap-1 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => handleBreadcrumb('factory')}
            className={`hover:text-blue-600 transition-colors ${level === 'factory' ? 'text-blue-600 font-semibold' : ''}`}
          >
            厂区
          </button>
          {(level === 'workshop' || level === 'line') && selectedWorkshop && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button
                type="button"
                onClick={() => handleBreadcrumb('workshop')}
                className={`hover:text-blue-600 transition-colors ${level === 'workshop' ? 'text-blue-600 font-semibold' : ''}`}
              >
                {selectedWorkshop.name}
              </button>
            </>
          )}
          {level === 'line' && selectedLine && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 font-semibold">{selectedLine.name}</span>
            </>
          )}
        </nav>
      </div>

      {/* 视图内容 —— AnimatePresence 负责切换动画 */}
      <AnimatePresence mode="wait">
        {level === 'factory' && (
          <motion.div
            key="factory"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <FactoryView workshops={FACTORY_DATA} onDrillDown={handleDrillToWorkshop} />
          </motion.div>
        )}

        {level === 'workshop' && selectedWorkshop && (
          <motion.div
            key="workshop"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <WorkshopView
              lines={selectedWorkshop.lines}
              workshopName={selectedWorkshop.name}
              onDrillDown={handleDrillToLine}
            />
          </motion.div>
        )}

        {level === 'line' && selectedLine && (
          <motion.div
            key="line"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <ProductionLineView line={selectedLine} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FactoryVisualization
```

**Step 2: Commit**

```bash
git add frontend/components/FactoryVisualization/index.tsx
git commit -m "feat(factory-vis): add FactoryVisualization container with drill-down nav"
```

---

## Task 8: 集成到 Dashboard.tsx

**Files:**
- Modify: `frontend/pages/Dashboard.tsx`

**Step 1: 找到 Dashboard 中现有布局区域的位置**

打开 `frontend/pages/Dashboard.tsx`，搜索 `DataDashboard` 或 `ProductionLineSelector` 组件的使用位置（大约在 return 语句的 JSX 中）。

**Step 2: 在文件顶部 import 区域添加**

在 `Dashboard.tsx` 现有 import 列表末尾追加：

```tsx
import FactoryVisualization from '../components/FactoryVisualization'
```

**Step 3: 在 JSX 中插入 FactoryVisualization 卡片**

找到 Dashboard 的主内容区（通常是 `DataDashboard` 组件下方），在其后插入：

```tsx
{/* 厂区动态图 */}
<FactoryVisualization />
```

具体位置：在 `<DataDashboard metrics={...} />` 组件之后、`<AnomalyList .../>` 之前插入。

**Step 4: 启动开发服务器验证**

```bash
cd frontend && npm run dev
```

浏览器打开 `http://localhost:3000`，登录后进入 `/app/`（生产可视化），确认：
- [ ] 页面下方出现"厂区动态图"卡片
- [ ] 显示 3 个车间等轴测方块（SMT / PCB / 3C）
- [ ] 点击 SMT 车间 → 切换到车间视图，显示 3 条产线
- [ ] 点击 A03 产线（故障状态）→ 切换到产线视图，显示工位
- [ ] 工位间粒子动画正常流动
- [ ] 底部显示"仿真测试数据"占位提示
- [ ] 面包屑"厂区 > SMT 车间 > SMT A03"可点击返回

**Step 5: 运行 Lint 检查**

```bash
cd frontend && npm run lint
```

期望：0 errors

**Step 6: Commit**

```bash
git add frontend/pages/Dashboard.tsx
git commit -m "feat(dashboard): integrate FactoryVisualization 2.5D drill-down card"
```

---

## 验收标准

| 功能 | 预期行为 |
|------|---------|
| 厂区视图 | 3 个车间等轴测方块，状态色正确（SMT=红/PCB=绿/3C=红） |
| 下钻交互 | 点击车间进入车间视图，点击产线进入产线视图 |
| 面包屑 | 面包屑可点击返回上层，层级文字正确 |
| 动画过渡 | 层级切换有 fade+scale 过渡，不卡顿 |
| 物料粒子 | 车间视图和产线视图均有粒子沿路径流动 |
| 故障脉冲 | error 状态方块有红色脉冲圆点动画 |
| 占位提示 | 产线视图底部有"仿真测试数据"amber 提示条 |
| Lint | `npm run lint` 0 errors |

---

*计划版本: 1.0 | 日期: 2026-02-28*
