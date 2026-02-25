import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAnomalyAnalysis, getAnomaliesByLineType, getSolutionsByAnomalyId, SMT_ANOMALIES, PCB_ANOMALIES, THREE_C_ANOMALIES } from '../mockData'
import type { AnomalyAnalysis, AnomalyDetail, SolutionWithCost } from '../types'

const SinanAnalysis: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [anomalyId, setAnomalyId] = useState<string | null>(null)
  const [anomaly, setAnomaly] = useState<AnomalyAnalysis | null>(null)
  const [solutions, setSolutions] = useState<SolutionWithCost[]>([])
  const [selectedSolution, setSelectedSolution] = useState<SolutionWithCost | null>(null)
  const [sortBy, setSortBy] = useState<'cost' | 'time' | 'risk'>('cost')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const id = params.get('anomalyId')
    if (id) {
      setAnomalyId(id)
      const analysis = getAnomalyAnalysis(id)
      if (analysis) {
        setAnomaly(analysis)
      }
      const sols = getSolutionsByAnomalyId(id)
      setSolutions(sols)
      if (sols.length > 0) {
        const recommended = sols.find((s) => s.type === 'recommended')
        setSelectedSolution(recommended || sols[0])
      }
    }
  }, [location.search])

  const sortedSolutions = useCallback(() => {
    const sorted = [...solutions]
    switch (sortBy) {
      case 'cost':
        return sorted.sort((a, b) => (a.totalExpectedLoss || 0) - (b.totalExpectedLoss || 0))
      case 'time':
        return sorted.sort(
          (a, b) => (a.implementationTimeHours || 0) - (b.implementationTimeHours || 0)
        )
      case 'risk':
        return sorted.sort((a, b) => {
          const riskOrder = { low: 0, medium: 1, high: 2 }
          return (riskOrder[a.riskLevel || 'low'] || 0) - (riskOrder[b.riskLevel || 'low'] || 0)
        })
      default:
        return sorted
    }
  }, [solutions, sortBy])

  const handleAdoptSolution = (solution: SolutionWithCost) => {
    navigate(`/app/zhixing?solutionId=${solution.id}&anomalyId=${anomalyId}`, {
      state: {
        solutionId: solution.id,
        solutionName: solution.title,
        anomalyId,
        costMatrix: solution.costMatrix,
      },
    })
  }

  const formatCost = (cost: number | undefined) => {
    if (cost === undefined || cost === null) return '¥0'
    if (cost >= 10000) {
      return `¥${(cost / 10000).toFixed(1)}万`
    }
    return `¥${cost.toLocaleString()}`
  }

  const formatDuration = (hours: number | undefined) => {
    if (hours === undefined || hours === null) return '0分钟'
    if (hours < 1) {
      return `${Math.round(hours * 60)}分钟`
    }
    return `${hours.toFixed(1)}小时`
  }

  const getRiskColor = (risk: string | undefined) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getRiskLabel = (risk: string | undefined) => {
    switch (risk) {
      case 'low':
        return '低风险'
      case 'medium':
        return '中风险'
      case 'high':
        return '高风险'
      default:
        return '未知'
    }
  }

  // 获取所有异常数据用于默认页面
  const allAnomalies = useMemo(() => {
    return [
      ...SMT_ANOMALIES,
      ...PCB_ANOMALIES,
      ...THREE_C_ANOMALIES,
    ].sort((a, b) => {
      const levelOrder = { critical: 0, error: 1, warning: 2 }
      return (levelOrder[a.level] || 2) - (levelOrder[b.level] || 2)
    })
  }, [])

  // 统计数据
  const stats = useMemo(() => {
    const critical = allAnomalies.filter(a => a.level === 'critical').length
    const error = allAnomalies.filter(a => a.level === 'error').length
    const warning = allAnomalies.filter(a => a.level === 'warning').length
    return { critical, error, warning, total: allAnomalies.length }
  }, [allAnomalies])

  // 处理异常项点击
  const handleAnomalyClick = (id: string) => {
    navigate(`/app/sinan?anomalyId=${id}`)
  }

  // 获取等级样式
  const getLevelStyle = (level: AnomalyDetail['level']) => {
    switch (level) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
      case 'error':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' }
      case 'warning':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
    }
  }

  if (!anomalyId || !anomaly) {
    return (
      <div className="p-6 max-w-7xl mx-auto h-full flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/app/')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
              司南 · 智能诊断中心
            </h1>
            <p className="text-slate-500 text-sm mt-1">实时监控 · 智能分析 · 快速决策</p>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
          {/* 左侧：状态概览 + 快速诊断 */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* 系统状态卡片 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-shrink-0">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-500" />
                诊断状态概览
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                  <p className="text-xs text-red-500 mt-1">严重异常</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <p className="text-2xl font-bold text-orange-600">{stats.error}</p>
                  <p className="text-xs text-orange-500 mt-1">高优先级</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
                  <p className="text-xs text-amber-500 mt-1">一般告警</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-blue-500 mt-1">待处理总数</p>
                </div>
              </div>
            </div>

            {/* 快速诊断入口 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white flex-shrink-0">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Sparkles size={18} />
                智能诊断
              </h3>
              <p className="text-sm text-blue-100 mb-4">
                输入问题描述，系统将自动分析并推荐最优解决方案
              </p>
              <button
                type="button"
                onClick={() => navigate('/app/gewu')}
                className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                前往格物知识图谱
                <ArrowRight size={16} />
              </button>
            </div>

            {/* 功能卡片 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1 min-h-0 overflow-hidden">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                快捷功能
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/gewu')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-slate-700">格物 · 知识图谱</p>
                    <p className="text-xs text-slate-500">查看异常根因分析</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/tianchou')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-slate-700">天筹 · 决策优化</p>
                    <p className="text-xs text-slate-500">产线布局优化</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/')}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-slate-700">生产看板</p>
                    <p className="text-xs text-slate-500">实时生产监控</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500" />
                </button>
              </div>
            </div>
          </div>

          {/* 中间 + 右侧：异常列表 */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    待诊断异常列表
                  </h2>
                  <div className="flex items-center gap-2 text-xs">
                    {stats.critical > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        {stats.critical} 严重
                      </span>
                    )}
                    {stats.error > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                        {stats.error} 高优
                      </span>
                    )}
                    {stats.warning > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        {stats.warning} 告警
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 异常列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {allAnomalies.map((anomaly) => {
                    const style = getLevelStyle(anomaly.level)
                    return (
                      <button
                        key={anomaly.id}
                        type="button"
                        onClick={() => handleAnomalyClick(anomaly.id)}
                        className="w-full text-left p-4 rounded-xl border transition-all hover:shadow-md group"
                        style={{ backgroundColor: style.bg.includes('red') ? '#fef2f2' : style.bg.includes('orange') ? '#fff7ed' : '#fffbeb' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                                {anomaly.level === 'critical' ? '严重' : anomaly.level === 'error' ? '高优' : '告警'}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{anomaly.time}</span>
                              <span className="text-xs text-slate-500">{anomaly.lineType}</span>
                            </div>
                            <p className="font-semibold text-slate-800 text-sm mb-1">{anomaly.location}</p>
                            <p className="text-xs text-slate-600 line-clamp-2">{anomaly.message}</p>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
                            <span className="text-xs font-medium">诊断</span>
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 底部提示 */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <p className="text-xs text-slate-500 text-center">
                  点击异常条目进入智能诊断流程，系统将自动分析根因并推荐解决方案
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/app/gewu?anomalyId=' + anomalyId)}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">
            司南 · 智能诊断中心
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            异常：{anomaly.defectType} | 置信度：
            {((anomaly.rootCauseConfidence || 0) * 100).toFixed(0)}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">排序：</span>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {[
              { key: 'cost', label: '成本' },
              { key: 'time', label: '时间' },
              { key: 'risk', label: '风险' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key as 'cost' | 'time' | 'risk')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === opt.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              解决方案对比
            </h2>

            <div className="space-y-4">
              {sortedSolutions().map((sol) => (
                <div
                  key={sol.id}
                  className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedSolution?.id === sol.id
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedSolution(sol)}
                >
                  {sol.type === 'recommended' && (
                    <div className="absolute -top-3 left-6 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                      <Sparkles size={12} />
                      推荐
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-800 text-lg">{sol.title}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={14} /> {sol.duration}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded border ${getRiskColor(sol.riskLevel)}`}
                      >
                        <ShieldAlert size={14} /> {getRiskLabel(sol.riskLevel)}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 mb-4 text-sm">{sol.description}</p>

                  <div className="grid grid-cols-5 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">维修成本</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {formatCost(sol.repairCost)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">交期影响</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {formatCost(sol.deliveryImpactCost)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">品质风险</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {formatCost(sol.qualityRiskCost)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">停产损失</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {formatCost(sol.downtimeCost)}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                      <p className="text-xs text-red-500 mb-1">综合损失</p>
                      <p className="font-bold text-red-600 text-sm">
                        {formatCost(sol.totalExpectedLoss)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>实施时间: {formatDuration(sol.implementationTimeHours)}</span>
                      <span className="flex items-center gap-1">
                        {sol.successRate && sol.successRate >= 0.9 ? (
                          <TrendingUp size={14} className="text-green-500" />
                        ) : (
                          <TrendingDown size={14} className="text-amber-500" />
                        )}
                        成功率: {((sol.successRate || 0) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAdoptSolution(sol)
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                        sol.type === 'recommended'
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Check size={16} />
                      采纳并执行
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              根因分析
            </h2>

            <div className="space-y-3">
              {anomaly.causationChain.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      item.type === 'phenomenon'
                        ? 'bg-orange-100 text-orange-600'
                        : item.type === 'direct_cause'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">
                      {item.type === 'phenomenon'
                        ? '现象'
                        : item.type === 'direct_cause'
                          ? '直接原因'
                          : '根本原因'}
                    </p>
                    <p className="text-sm text-slate-700">{item.description}</p>
                  </div>
                  {index < anomaly.causationChain.length - 1 && (
                    <ChevronRight size={16} className="text-slate-300 mt-1" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-bold">置信度：</span>
                {((anomaly.rootCauseConfidence || 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white flex flex-col justify-between shadow-lg flex-1">
            <div>
              <h3 className="font-bold mb-2">解锁更多高级算法</h3>
              <p className="text-sm text-slate-400">
                当前仅启用了基础诊断，升级以获得"预测性维护"功能。
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              前往能力商店
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SinanAnalysis
