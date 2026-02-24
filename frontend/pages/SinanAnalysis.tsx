import {
  ArrowLeft,
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
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAnomalyAnalysis, getSolutionsByAnomalyId } from '../mockData'
import type { AnomalyAnalysis, SolutionWithCost } from '../types'

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

  if (!anomalyId || !anomaly) {
    return (
      <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/app/')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              司南 · 智能诊断中心
              <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded-full">
                AI Powered
              </span>
            </h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-slate-400 mb-4">
              <Sparkles size={48} className="mx-auto opacity-50" />
            </div>
            <p className="text-slate-600 mb-4">请从格物页面跳转以查看智能诊断结果</p>
            <button
              onClick={() => navigate('/app/gewu')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              前往格物
            </button>
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            司南 · 智能诊断中心
            <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded-full">
              AI Powered
            </span>
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
                      AI 推荐
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
