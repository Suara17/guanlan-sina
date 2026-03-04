import { Expand, Factory, Minimize2 } from 'lucide-react'
import type React from 'react'
import { lazy, Suspense, useEffect, useState } from 'react'

const FactoryVisualization3D = lazy(() => import('../FactoryVisualization3D'))

const FactoryVisualization: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', onEsc)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onEsc)
      document.body.style.overflow = overflow
    }
  }, [isFullscreen])

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Factory className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">厂区 3D 动态图</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <Expand className="h-3.5 w-3.5" />
            全屏
          </button>
        </div>

        <div className="relative h-[520px] overflow-hidden rounded-lg border border-slate-100">
          {!isFullscreen && (
            <Suspense
              fallback={<div className="h-full w-full animate-pulse bg-slate-100/80 rounded-lg" />}
            >
              <FactoryVisualization3D />
            </Suspense>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute right-4 top-4 z-[130] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              退出全屏
            </button>
            <Suspense
              fallback={<div className="h-full w-full animate-pulse bg-slate-100/80 rounded-lg" />}
            >
              <FactoryVisualization3D />
            </Suspense>
          </div>
        </div>
      )}
    </>
  )
}

export default FactoryVisualization
