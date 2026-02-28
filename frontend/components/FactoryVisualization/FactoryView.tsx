// frontend/components/FactoryVisualization/FactoryView.tsx
// Level 0：3 个车间等轴测全览，点击进入车间
import { AnimatePresence } from 'framer-motion'
import type React from 'react'
import type { Workshop } from './factoryData'
import IsometricBlock from './IsometricBlock'

interface FactoryViewProps {
  workshops: Workshop[]
  onDrillDown: (workshop: Workshop) => void
}

const SVG_WIDTH = 860
const SVG_HEIGHT = 320
const OFFSET_X = SVG_WIDTH / 2
const OFFSET_Y = 80

const FactoryView: React.FC<FactoryViewProps> = ({ workshops, onDrillDown }) => {
  const totalLines = workshops.reduce((n, w) => n + w.lines.length, 0)
  const errorLines = workshops.reduce(
    (n, w) => n + w.lines.filter((l) => l.status === 'error').length,
    0
  )
  const runningLines = workshops.reduce(
    (n, w) => n + w.lines.filter((l) => l.status === 'running').length,
    0
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
        role="img"
        aria-label="厂区等轴测全览图"
      >
        <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
          <AnimatePresence>
            {workshops.map((workshop) => {
              const { col, row } = workshop.gridPos
              const errorCount = workshop.lines.filter((l) => l.status === 'error').length

              return (
                <IsometricBlock
                  key={workshop.id}
                  col={col * 1.2}
                  row={row}
                  status={workshop.status}
                  label={workshop.name}
                  subLabel={
                    errorCount > 0
                      ? `⚠ ${errorCount} 条产线异常`
                      : `${workshop.lines.length} 条产线`
                  }
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
