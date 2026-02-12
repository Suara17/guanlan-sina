/**
 * 任务配置表单组件
 */

import { useState } from 'react'
import { IndustryType, type OptimizationRequestParams } from '../types/tianchou'

interface Props {
  onSubmit: (params: OptimizationRequestParams) => void
}

export function TaskConfigForm({ onSubmit }: Props) {
  const [industryType, setIndustryType] = useState<IndustryType>(IndustryType.LIGHT)
  const [name, setName] = useState('')

  // 轻工业参数
  const [workshopLength, setWorkshopLength] = useState(100)
  const [workshopWidth, setWorkshopWidth] = useState(80)
  const [deviceCount, setDeviceCount] = useState(10)

  // 重工业参数
  const [stationCount, setStationCount] = useState(8)
  const [agvCount, setAgvCount] = useState(3)

  // 商业参数
  const [dailyOutputValue, setDailyOutputValue] = useState(20000)
  const [baseCost, setBaseCost] = useState(20000)

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

    onSubmit(params)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">创建优化任务</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础信息 */}
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

        {/* 行业类型 */}
        <div>
          <label className="block text-sm font-medium mb-2">行业类型</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIndustryType(IndustryType.LIGHT)}
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
              onClick={() => setIndustryType(IndustryType.HEAVY)}
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

        {/* 轻工业参数 */}
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

        {/* 重工业参数 */}
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

        {/* 商业参数 */}
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

        {/* 提交按钮 */}
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
