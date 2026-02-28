// frontend/components/FactoryVisualization/WorkshopView.tsx
// Level 1：车间内 3 条产线，等轴测排列，含物料流粒子
import { AnimatePresence } from 'framer-motion'
import type React from 'react'
import type { WorkshopLine } from './factoryData'
import IsometricBlock, { isoToScreen, TILE_H } from './IsometricBlock'
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
        role="img"
        aria-label="车间产线等轴测视图"
      >
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
          <AnimatePresence>
            {lines.map((line, i) => {
              const col = 0
              const row = i * 1.3

              return (
                <IsometricBlock
                  key={line.id}
                  col={col}
                  row={row}
                  status={line.status}
                  label={line.name}
                  subLabel={
                    line.currentOrder !== '—' ? `工单 ${line.currentOrder.slice(-3)}` : '待机'
                  }
                  onClick={() => onDrillDown(line)}
                  scale={1.4}
                  showPulse={line.status !== 'running'}
                />
              )
            })}
          </AnimatePresence>

          {/* 产线间物料流粒子 */}
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
