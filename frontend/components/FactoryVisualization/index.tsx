import { Expand, Factory, Minimize2 } from 'lucide-react'
import type React from 'react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const FactoryVisualization3D = lazy(() => import('../FactoryVisualization3D'))

const FactoryVisualization: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    const openFullscreen = async () => {
      if (!isFullscreen || !fullscreenContainerRef.current || document.fullscreenElement) return
      try {
        await fullscreenContainerRef.current.requestFullscreen()
      } catch (error) {
        console.warn('进入全屏失败:', error)
        setIsFullscreen(false)
      }
    }

    openFullscreen()
  }, [isFullscreen])

  const handleEnterFullscreen = () => {
    setIsFullscreen(true)
  }

  const handleExitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    setIsFullscreen(false)
  }

  return (
    <>
      <div className="flex h-full flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-1.5">
              <Factory className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">厂区 3D 动态图</span>
          </div>

          <button
            type="button"
            onClick={handleEnterFullscreen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <Expand className="h-3.5 w-3.5" />
            全屏
          </button>
        </div>

        <div className="relative h-[390px] overflow-hidden rounded-lg border border-slate-100 xl:h-[360px]">
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
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[120] h-screen w-screen bg-slate-950 p-0"
        >
          <div className="relative h-full w-full overflow-hidden bg-slate-50 shadow-2xl">
            <button
              type="button"
              onClick={handleExitFullscreen}
              className="absolute right-4 top-4 z-[130] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm transition-colors hover:bg-white"
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
