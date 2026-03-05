/**
 * 任务配置表单组件
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import { getTemplateById, getTemplatesByIndustry } from '../data/templates'
import {
  IndustryType,
  type OptimizationRequestParams,
  type TaskConstraints,
  TaskPriority,
} from '../types/tianchou'

interface Props {
  onSubmit: (params: OptimizationRequestParams, constraints?: TaskConstraints) => void
  prefillFromScenario?: {
    scenarioName: string
    taskName?: string
    productionLines?: string[]
    expectedLoss?: number | null
    decisionSummary?: string
  }
}

export function TaskConfigForm({ onSubmit, prefillFromScenario }: Props) {
  const [industryType, setIndustryType] = useState<IndustryType>(IndustryType.LIGHT)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [name, setName] = useState('')

  const [workshopLength, setWorkshopLength] = useState(80)
  const [workshopWidth, setWorkshopWidth] = useState(60)
  const [deviceCount, setDeviceCount] = useState(25)

  const [stationCount, setStationCount] = useState(8)
  const [agvCount, setAgvCount] = useState(3)

  const [dailyOutputValue, setDailyOutputValue] = useState(20000)
  const [baseCost, setBaseCost] = useState(20000)

  const [showAdvanced, setShowAdvanced] = useState(false)

  const [deadline, setDeadline] = useState('')
  const [maxCycleTime, setMaxCycleTime] = useState<number | undefined>(undefined)
  const [changeoverTime, setChangeoverTime] = useState<number | undefined>(undefined)
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.NORMAL)
  const [batchCount, setBatchCount] = useState<number | undefined>(undefined)

  const templates = getTemplatesByIndustry(industryType)

  useEffect(() => {
    if (!prefillFromScenario) return
    if (prefillFromScenario.taskName) {
      setName(prefillFromScenario.taskName)
    }
  }, [prefillFromScenario])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return

    const template = getTemplateById(templateId)
    if (!template) return

    setName(template.params.name || '')

    if (template.params.workshop_length) {
      setWorkshopLength(template.params.workshop_length)
      setWorkshopWidth(template.params.workshop_width || 60)
      setDeviceCount(template.params.device_count || 25)
    }

    if (template.params.station_count) {
      setStationCount(template.params.station_count)
      setAgvCount(template.params.agv_count || 3)
    }

    if (template.params.daily_output_value) {
      setDailyOutputValue(template.params.daily_output_value)
      setBaseCost(template.params.base_cost || template.params.daily_output_value)
    }

    if (template.constraints) {
      setDeadline(template.constraints.deadline || '')
      setMaxCycleTime(template.constraints.max_cycle_time)
      setChangeoverTime(template.constraints.changeover_time)
      setPriority(template.constraints.priority || TaskPriority.NORMAL)
      setBatchCount(template.constraints.batch_count)
    }
  }

  const handleIndustryChange = (type: IndustryType) => {
    setIndustryType(type)
    setSelectedTemplateId('')
    setDeadline('')
    setMaxCycleTime(undefined)
    setChangeoverTime(undefined)
    setPriority(TaskPriority.NORMAL)
    setBatchCount(undefined)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params: OptimizationRequestParams = {
      name,
      industry_type: industryType,
      daily_output_value: dailyOutputValue,
      base_cost: baseCost,
    }

    if (industryType === IndustryType.LIGHT) {
      params.workshop_length = workshopLength
      params.workshop_width = workshopWidth
      params.device_count = deviceCount
      params.construction_rate = 3000
      params.benefit_multiplier = 200
    } else {
      params.station_count = stationCount
      params.agv_count = agvCount
      params.benefit_multiplier = 50000
    }

    const constraints: TaskConstraints = {}
    if (deadline) constraints.deadline = deadline
    if (maxCycleTime) constraints.max_cycle_time = maxCycleTime
    if (changeoverTime) constraints.changeover_time = changeoverTime
    if (priority) constraints.priority = priority
    if (batchCount) constraints.batch_count = batchCount
    if (prefillFromScenario?.productionLines && prefillFromScenario.productionLines.length > 0) {
      constraints.production_lines = prefillFromScenario.productionLines
    }

    const hasConstraints = Object.keys(constraints).length > 0
    onSubmit(hasConstraints ? params : params, hasConstraints ? constraints : undefined)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">创建优化任务</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {prefillFromScenario && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
            <p className="font-semibold text-blue-800">
              来自场景编排：{prefillFromScenario.scenarioName}
            </p>
            <p className="mt-1 text-blue-700">
              {prefillFromScenario.decisionSummary || '已注入编排上下文约束。'}
            </p>
            {prefillFromScenario.productionLines &&
              prefillFromScenario.productionLines.length > 0 && (
                <p className="mt-1 text-blue-700">
                  适用产线：{prefillFromScenario.productionLines.join(', ')}
                </p>
              )}
            {prefillFromScenario.expectedLoss != null && (
              <p className="mt-1 text-blue-700">
                预期损失：¥{prefillFromScenario.expectedLoss.toLocaleString()}
              </p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">任务名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="例如: 车间布局优化方案A"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">行业类型</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleIndustryChange(IndustryType.LIGHT)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                industryType === IndustryType.LIGHT
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">轻工业</div>
              <div className="text-sm text-gray-600">车间布局优化</div>
            </button>
            <button
              type="button"
              onClick={() => handleIndustryChange(IndustryType.HEAVY)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                industryType === IndustryType.HEAVY
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">重工业</div>
              <div className="text-sm text-gray-600">AGV调度优化</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">选择模板 (可选)</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- 选择预设模板 --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.name}
              </option>
            ))}
          </select>
          {selectedTemplateId && (
            <p className="mt-1 text-sm text-gray-500">
              {getTemplateById(selectedTemplateId)?.description}
            </p>
          )}
        </div>

        {industryType === IndustryType.LIGHT && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">轻工业参数</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">车间长度 (米)</label>
                <input
                  type="number"
                  value={workshopLength}
                  onChange={(e) => setWorkshopLength(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                  min="10"
                  max="500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">车间宽度 (米)</label>
                <input
                  type="number"
                  value={workshopWidth}
                  onChange={(e) => setWorkshopWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                  min="10"
                  max="500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">设备数量</label>
                <input
                  type="number"
                  value={deviceCount}
                  onChange={(e) => setDeviceCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                  min="5"
                  max="50"
                />
              </div>
            </div>
          </div>
        )}

        {industryType === IndustryType.HEAVY && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">重工业参数</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">工位数量</label>
                <input
                  type="number"
                  value={stationCount}
                  onChange={(e) => setStationCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                  min="3"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">AGV数量</label>
                <input
                  type="number"
                  value={agvCount}
                  onChange={(e) => setAgvCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">商业参数</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">每日产值 (元)</label>
              <input
                type="number"
                value={dailyOutputValue}
                onChange={(e) => setDailyOutputValue(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">基础成本 (元)</label>
              <input
                type="number"
                value={baseCost}
                onChange={(e) => setBaseCost(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                min="1000"
                step="1000"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            高级选项 (时间约束、资源约束)
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">交期 (截止日期)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">最大周期时间 (分钟)</label>
                  <input
                    type="number"
                    value={maxCycleTime ?? ''}
                    onChange={(e) =>
                      setMaxCycleTime(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border rounded"
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">切换时间 (分钟)</label>
                  <input
                    type="number"
                    value={changeoverTime ?? ''}
                    onChange={(e) =>
                      setChangeoverTime(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border rounded"
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">批次数量</label>
                  <input
                    type="number"
                    value={batchCount ?? ''}
                    onChange={(e) =>
                      setBatchCount(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border rounded"
                    placeholder="可选"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">优先级</label>
                <div className="flex gap-2">
                  {[
                    { value: TaskPriority.LOW, label: '低', color: 'gray' },
                    { value: TaskPriority.NORMAL, label: '普通', color: 'blue' },
                    { value: TaskPriority.HIGH, label: '高', color: 'orange' },
                    { value: TaskPriority.URGENT, label: '紧急', color: 'red' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`flex-1 py-2 px-3 rounded border transition ${
                        priority === opt.value
                          ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          开始优化
        </button>
      </form>
    </div>
  )
}
