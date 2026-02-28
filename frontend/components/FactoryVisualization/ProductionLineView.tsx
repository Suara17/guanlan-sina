// frontend/components/FactoryVisualization/ProductionLineView.tsx
// Level 2：产线工位等轴测展示，含传送带粒子、节拍信息、实时数据占位提示
import { AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import type React from 'react'
import type { WorkshopLine } from './factoryData'
import IsometricBlock, { isoToScreen, TILE_W } from './IsometricBlock'
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
            const pathD = `M ${from.x + (TILE_W * 0.95) / 2} ${from.y} L ${to.x - (TILE_W * 0.95) / 2} ${to.y}`

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
