/**
 * 帕累托前沿三联散点图组件
 * 优先使用后端算法生成的图片，如果不可用则使用前端 Recharts 绘制
 */

import { useEffect, useState } from 'react'
import { tianchouService } from '../services/tianchouService'
import type { IndustryType, ParetoSolution } from '../types/tianchou'

interface ParetoTriplotProps {
  solutions: ParetoSolution[]
  onSelect?: (solution: ParetoSolution) => void
  selectedId?: string
  industryType?: IndustryType
  taskName?: string
  taskId?: string
}

export function ParetoTriplot({
  solutions,
  onSelect,
  selectedId,
  industryType,
  taskName,
  taskId,
}: ParetoTriplotProps) {
  const [paretoPlotImage, setParetoPlotImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取后端生成的图片
  useEffect(() => {
    if (taskId) {
      // 重置状态，确保不会显示旧图片
      setLoading(true)
      setError(null)
      setParetoPlotImage(null) // 关键：清除旧图片

      tianchouService
        .getAllSolutions(taskId)
        .then((data) => {
          console.log(
            `[ParetoTriplot] taskId=${taskId}, hasImage=${!!data.pareto_plot_image}, imageSize=${data.pareto_plot_image?.length || 0}`
          )
          if (data.pareto_plot_image) {
            setParetoPlotImage(data.pareto_plot_image)
          } else {
            setError('暂无帕累托前沿图片数据')
          }
        })
        .catch((err) => {
          console.error('获取帕累托前沿图片失败:', err)
          setError('加载图片失败')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [taskId])

  // 根据行业类型获取标签
  const getLabels = () => {
    const isHeavy = industryType === 'heavy'
    return {
      f1: isHeavy ? '最大完工时间' : '物料搬运成本',
      f2: isHeavy ? '瓶颈设备利用率' : '设备移动成本',
      f3: isHeavy ? '负载不均衡度' : '空间利用率',
    }
  }

  const labels = getLabels()

  if (loading) {
    return (
      <div className="bg-white p-6 w-full font-sans rounded-xl shadow-sm">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span>加载帕累托前沿图片中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !paretoPlotImage) {
    return (
      <div className="bg-white p-6 w-full font-sans rounded-xl shadow-sm">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-gray-400 mb-2">{error}</p>
            <p className="text-sm text-gray-400">请先运行优化任务</p>
          </div>
        </div>
      </div>
    )
  }

  // 获取选中的方案
  const selectedSolution = solutions.find((s) => s.id === selectedId)

  return (
    <div className="bg-white p-6 w-full font-sans rounded-xl shadow-sm">
      <h2 className="text-lg text-center font-semibold text-gray-800 mb-4">
        帕累托前沿分析 {taskName ? `- ${taskName}` : ''}
      </h2>

      {/* 统计信息 */}
      <div className="flex justify-center gap-6 mb-4 text-sm text-gray-500">
        <span>
          帕累托解: <span className="font-medium text-amber-500">{solutions.length}</span> 个
        </span>
        {selectedSolution && (
          <span>
            已选择:{' '}
            <span className="font-medium text-blue-500">方案 #{selectedSolution.rank || 1}</span>
          </span>
        )}
      </div>

      {/* 显示后端生成的图片 */}
      {paretoPlotImage && (
        <div className="flex justify-center">
          <img
            src={`data:image/png;base64,${paretoPlotImage}`}
            alt="帕累托前沿分析"
            className="max-w-full h-auto rounded-lg shadow-sm"
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}

      {/* 选中方案的详细信息 */}
      {selectedSolution && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-3">
            选中方案 #{selectedSolution.rank || 1} 的技术指标
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-gray-500 mb-1">{labels.f1} (f1)</div>
              <div className="font-bold text-lg text-gray-800">
                {selectedSolution.f1.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-gray-500 mb-1">{labels.f2} (f2)</div>
              <div className="font-bold text-lg text-gray-800">
                {selectedSolution.f2.toFixed(4)}
              </div>
            </div>
            {selectedSolution.f3 !== undefined && selectedSolution.f3 !== null && (
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-gray-500 mb-1">{labels.f3} (f3)</div>
                <div className="font-bold text-lg text-gray-800">
                  {selectedSolution.f3.toFixed(4)}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div className="text-gray-600">
              总成本:{' '}
              <span className="font-medium">¥{selectedSolution.total_cost.toLocaleString()}</span>
            </div>
            <div className="text-gray-600">
              实施工期:{' '}
              <span className="font-medium">
                {selectedSolution.implementation_days.toFixed(1)} 天
              </span>
            </div>
            <div className="text-gray-600">
              预期收益:{' '}
              <span className="font-medium text-green-600">
                ¥{selectedSolution.expected_benefit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        图片由后端算法生成，展示了完整的帕累托前沿分布
      </p>
    </div>
  )
}
