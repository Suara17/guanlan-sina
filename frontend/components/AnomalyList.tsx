import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnomaliesByLineType } from '../mockData'
import type { AnomalyDetail } from '../types'

interface Props {
  lineType: 'SMT' | 'PCB' | '3C'
  className?: string
}

const AnomalyList: React.FC<Props> = ({ lineType, className }) => {
  const navigate = useNavigate()

  // 根据产线类型获取异常数据
  const filteredAnomalies = useMemo(() => {
    return getAnomaliesByLineType(lineType)
  }, [lineType])

  // 点击异常项跳转到格物图谱页面
  const handleAnomalyClick = (anomalyId: string) => {
    navigate(`/app/gewu?anomalyId=${anomalyId}`)
  }

  // 获取等级图标
  const getLevelIcon = (level: AnomalyDetail['level']) => {
    switch (level) {
      case 'critical':
        return <XCircle size={16} className="text-red-500" />
      case 'error':
        return <AlertCircle size={16} className="text-orange-500" />
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />
    }
  }

  // 获取等级样式
  const getLevelStyle = (level: AnomalyDetail['level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-100 text-red-600'
      case 'error':
        return 'bg-orange-50 border-orange-100 text-orange-600'
      case 'warning':
        return 'bg-yellow-50 border-yellow-100 text-yellow-700'
    }
  }

  // 获取等级点颜色
  const getLevelDotColor = (level: AnomalyDetail['level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500'
      case 'error':
        return 'bg-orange-500'
      case 'warning':
        return 'bg-yellow-400'
    }
  }

  // 获取当前产线类型
  const currentLineType = lineType

  // 统计各等级数量
  const criticalCount = filteredAnomalies.filter((a) => a.level === 'critical').length
  const errorCount = filteredAnomalies.filter((a) => a.level === 'error').length
  const warningCount = filteredAnomalies.filter((a) => a.level === 'warning').length

  return (
    <div className={`bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col ${className || ''}`} data-tour="dashboard-anomaly">
      {/* 头部标题和统计 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-lg">异常信息</h3>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                {criticalCount} 严重
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                {errorCount} 错误
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-semibold">
                {warningCount} 警告
              </span>
            )}
          </div>
        </div>

        {/* 产线类型标识 */}
        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
          {currentLineType} 产线异常
        </div>
      </div>

      {/* 异常列表 */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative">
        {/* 时间轴线 */}
        <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />

        {filteredAnomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <AlertCircle size={36} className="mb-2 opacity-50" />
            <p className="text-sm">暂无异常信息</p>
          </div>
        ) : (
          filteredAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              onClick={() => handleAnomalyClick(anomaly.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnomalyClick(anomaly.id)}
              className="relative pl-6 group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-blue-100"
            >
              {/* 时间轴点 */}
              <div
                className={`absolute left-[5px] top-5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 ${getLevelDotColor(anomaly.level)}`}
              />

              {/* 时间和等级 */}
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-slate-400">{anomaly.time}</span>
                <div className="flex items-center gap-1">
                  {getLevelIcon(anomaly.level)}
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getLevelStyle(anomaly.level)}`}
                  >
                    {anomaly.level}
                  </span>
                </div>
              </div>

              {/* 位置 */}
              <p className="font-semibold text-slate-800 text-sm mb-1">{anomaly.location}</p>

              {/* 消息 */}
              <p className="text-xs text-slate-600 leading-relaxed">{anomaly.message}</p>

              {/* Hover提示 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-blue-600 font-medium">点击查看详情 →</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      {filteredAnomalies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            共 {filteredAnomalies.length} 条异常 · 点击查看格物图谱分析
          </p>
        </div>
      )}
    </div>
  )
}

export default AnomalyList
