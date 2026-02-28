// frontend/components/FactoryVisualization/index.tsx
// 主容器：管理厂区 → 车间 → 产线三级下钻状态，面包屑导航
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Factory } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import FactoryView from './FactoryView'
import type { Workshop, WorkshopLine } from './factoryData'
import { FACTORY_DATA } from './factoryData'
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
