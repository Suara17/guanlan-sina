import { Activity, ArrowLeft, Box, ChevronRight, Factory, Globe, RotateCcw } from 'lucide-react'
import type React from 'react'
import { FactoryScene } from './FactoryScene'
import { useFactoryStore } from './store'

interface FactoryVisualization3DProps {
  className?: string
}

const getStatusLabel = (status: 'running' | 'idle' | 'error'): string => {
  if (status === 'running') return '运行中'
  if (status === 'idle') return '待机'
  return '故障'
}

export const FactoryVisualization3D: React.FC<FactoryVisualization3DProps> = ({ className }) => {
  const { level, selectedFactory, selectedWorkshop, selectedLine, goBack, resetToGlobalView } =
    useFactoryStore()

  return (
    <div className={`relative h-full w-full flex flex-col ${className || ''}`}>
      {/* Header / Breadcrumbs */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200">
        <button
          type="button"
          onClick={resetToGlobalView}
          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'global' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
        >
          <Globe size={16} />
          <span>全局</span>
        </button>

        {level !== 'global' && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <button
              type="button"
              onClick={() =>
                selectedFactory && useFactoryStore.getState().drillDownToFactory(selectedFactory)
              }
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'factory' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
            >
              <Factory size={16} />
              <span>{selectedFactory?.name || '工厂'}</span>
            </button>
          </>
        )}

        {(level === 'workshop' || level === 'line') && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <button
              type="button"
              onClick={() =>
                selectedWorkshop && useFactoryStore.getState().drillDownToWorkshop(selectedWorkshop)
              }
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'workshop' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
            >
              <Box size={16} />
              <span>{selectedWorkshop?.name || '车间'}</span>
            </button>
          </>
        )}

        {level === 'line' && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <div className="flex items-center gap-2 px-2 py-1 font-bold text-blue-600">
              <Activity size={16} />
              <span>{selectedLine?.name || '产线'}</span>
            </div>
          </>
        )}
      </div>

      {/* 快捷控制 */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={resetToGlobalView}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-md hover:bg-slate-50"
        >
          <RotateCcw size={14} />
          重置视角
        </button>
        {level !== 'global' && (
          <button
            type="button"
            onClick={goBack}
            className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
            aria-label="返回上一级"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      {/* 3D Scene */}
      <div className="flex-1">
        <FactoryScene />
      </div>

      {/* Legend / Info Panel */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 text-sm">
        <h4 className="font-bold text-slate-800 mb-2">状态图例</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
            <span className="text-slate-600">{getStatusLabel('running')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
            <span className="text-slate-600">{getStatusLabel('idle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <span className="text-slate-600">{getStatusLabel('error')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FactoryVisualization3D
