import { Clock, Factory } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AnomalyList from '../components/AnomalyList'
import DataDashboard from '../components/DataDashboard'
import ProductionLineSelector from '../components/ProductionLineSelector'
import ProductionPlanCard from '../components/ProductionPlanCard'
import ProductChangeAlert from '../components/ProductChangeAlert'
import SinanAvatar from '../components/SinanAvatar'
import { DASHBOARD_METRICS, getAnomaliesByLineType, PRODUCTION_LINES } from '../mockData'
import type { DashboardMetrics, NextPlan, OptimizationParams, ProductionData, ProductionLine, ProductChangeWarning } from '../types'

// Mock Data
const PRODUCTION_DATA: ProductionData[] = [
  { time: '08:00', planned: 200, actual: 198 },
  { time: '09:00', planned: 220, actual: 215 },
  { time: '10:00', planned: 220, actual: 180 }, // Defect triggers red
  { time: '11:00', planned: 200, actual: 205 },
  { time: '12:00', planned: 150, actual: 150 }, // Lunch break
  { time: '13:00', planned: 220, actual: 218 },
  { time: '14:00', planned: 220, actual: 175 }, // Another drop
]

const QUALITY_DATA = [
  { name: '良品', value: 92 },
  { name: '不良品', value: 8 },
]

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [sinanMode, setSinanMode] = useState<'idle' | 'alert'>('idle')
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(PRODUCTION_LINES[0]) // 默认选中第一条产线
  
  // 3.2 优化路线：生产计划状态
  const [productionPlan, setProductionPlan] = useState<{
    currentPlan: {
      work_order_no: string
      product_id: string
      product_code: string
      product_name: string
      line_id: string
      planned_quantity: number
      actual_quantity: number
      progress_percent: number
      estimated_completion_time: string | null
      status: 'running' | 'paused' | 'completed'
    } | null
    nextPlan: NextPlan | null
    productChangeWarning: ProductChangeWarning | null
  }>({
    currentPlan: null,
    nextPlan: null,
    productChangeWarning: null,
  })

  const [showProductAlert, setShowProductAlert] = useState(false)

  // 3.2 优化路线：加载生产计划数据（Mock数据）
  useEffect(() => {
    // TODO: 替换为实际API调用
    // const fetchProductionPlan = async () => {
    //   const response = await api.getProductionPlan(selectedLine?.id)
    //   setProductionPlan(response.data)
    //   if (response.data.productChangeWarning?.change_detected) {
    //     setShowProductAlert(true)
    //   }
    // }
    // fetchProductionPlan()

    // Mock数据
    setProductionPlan({
      currentPlan: {
        work_order_no: 'WO-20260224-001',
        product_id: 'p-001',
        product_code: 'PCB-A',
        product_name: 'PCB-A型',
        line_id: selectedLine?.id || 'line-001',
        planned_quantity: 5000,
        actual_quantity: 3250,
        progress_percent: 65,
        estimated_completion_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'running',
      },
      nextPlan: {
        work_order_no: 'WO-20260224-002',
        product_id: 'p-002',
        product_code: 'PCB-B',
        product_name: 'PCB-B型',
        planned_quantity: 3000,
        estimated_start_time: null,
      },
      productChangeWarning: {
        change_detected: true,
        current_product: 'PCB-A',
        next_product: 'PCB-B',
        requires_optimization: true,
        flow_differences: [
          '新增回流焊工序',
          '印刷参数变更',
          '检测设备增加',
        ],
      },
    })
    // 显示预警弹窗
    setShowProductAlert(true)
  }, [selectedLine])

  // 3.2 优化路线：处理优化按钮点击
  const handleOptimize = (params: OptimizationParams) => {
    // 跳转到天筹页面，携带产品切换优化参数
    navigate('/app/tianchou', {
      state: {
        optimizationMode: 'product_switch',
        ...params,
      },
    })
  }

  // Get anomalies for the selected line
  const currentAnomalies = useMemo(() => {
    return selectedLine ? getAnomaliesByLineType(selectedLine.type) : []
  }, [selectedLine])

  // Determine alert message based on anomalies
  const alertMessage = useMemo(() => {
    if (currentAnomalies.length === 0) return '当前产线运行正常'

    // Prioritize Critical > Error > Warning
    const critical = currentAnomalies.find((a) => a.level === 'critical')
    if (critical) return `${critical.location} ${critical.message}`

    const error = currentAnomalies.find((a) => a.level === 'error')
    if (error) return `${error.location} ${error.message}`

    const warning = currentAnomalies.find((a) => a.level === 'warning')
    if (warning) return `${warning.location} ${warning.message}`

    return '检测到潜在异常风险'
  }, [currentAnomalies])

  // Update Sinan mode based on anomalies
  useEffect(() => {
    if (currentAnomalies.length > 0) {
      setSinanMode('alert')
    } else {
      setSinanMode('idle')
    }
  }, [currentAnomalies])

  // 产线选择处理函数
  const handleLineSelect = (line: ProductionLine) => {
    setSelectedLine(line)
  }

  // 获取当前选中产线的数据
  const dashboardMetrics = selectedLine
    ? DASHBOARD_METRICS[selectedLine.id]
    : DASHBOARD_METRICS[PRODUCTION_LINES[0].id]

  const renderActiveShape = (props: {
    cx: number
    cy: number
    innerRadius: number
    outerRadius: number
    startAngle: number
    endAngle: number
    fill: string
    payload: { name: string }
  }) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props
    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor="middle"
          fill="#334155"
          className="text-3xl font-bold"
        >
          {payload.name === '不良品' ? '8%' : ''}
        </text>
        <text x={cx} y={cy + 25} dy={8} textAnchor="middle" fill="#94a3b8" className="text-xs">
          不良品{' '}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    )
  }

  return (
    <div className="p-4 md:p-6 min-h-full flex flex-col gap-6">
      {/* Header Info Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
            <Factory size={20} />
          </div>
          <div className="flex-1">
            <ProductionLineSelector
              lines={PRODUCTION_LINES}
              selectedLine={selectedLine}
              onSelect={handleLineSelect}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <p className="text-slate-400 text-xs">当前班次</p>
            <p className="font-semibold text-slate-700">白班 (08:00 - 20:00)</p>
          </div>
          <div className="text-right border-l border-slate-100 pl-6">
            <p className="text-slate-400 text-xs">负责人</p>
            <p className="font-semibold text-slate-700">张工</p>
          </div>
          <div className="text-right border-l border-slate-100 pl-6">
            <p className="text-slate-400 text-xs">运行时间</p>
            <p className="font-mono font-semibold text-blue-600">06:32:15</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Data Dashboard & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 数据看板 */}
          <DataDashboard metrics={dashboardMetrics} />

          {/* 3.2 优化路线：生产计划模块 */}
          <ProductionPlanCard
            currentPlan={productionPlan.currentPlan}
            nextPlan={productionPlan.nextPlan}
            productChangeWarning={productionPlan.productChangeWarning}
            onOptimize={handleOptimize}
          />

          {/* Production Monitor */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> 实时产量监控
              </h3>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-slate-200 rounded-sm"></span> 计划产量
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-sm"></span> 实际产量
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-400 rounded-sm"></span> 异常差异{' '}
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PRODUCTION_DATA} barGap={0}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="planned" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="actual" radius={[4, 4, 0, 0]} barSize={20}>
                    {PRODUCTION_DATA.map((entry) => (
                      <Cell
                        key={`cell-${entry.time}`}
                        fill={entry.actual < entry.planned * 0.95 ? '#f87171' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
              <h3 className="font-bold text-slate-800 mb-2">质量实时看板</h3>
              <div className="h-full -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={QUALITY_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      activeIndex={1}
                      activeShape={renderActiveShape}
                    >
                      <Cell key="cell-0" fill="#22c55e" /> {/* Green for Good */}
                      <Cell key="cell-1" fill="#ef4444" /> {/* Red for Bad */}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                  环比昨日 ↓3.8%
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">设备综合效率 (OEE)</span>
                <span className="text-xl font-bold text-slate-800">
                  {((dashboardMetrics.completionRate + dashboardMetrics.efficiency) / 2).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(dashboardMetrics.completionRate + dashboardMetrics.efficiency) / 2}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-500">本班次完成率</span>
                <span className="text-xl font-bold text-slate-800">
                  {dashboardMetrics.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${dashboardMetrics.completionRate}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-500">平均节拍 (CT)</span>
                <span className="text-xl font-bold text-slate-800">24s</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* 订阅价值复盘 */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">订阅价值复盘</h3>
              <button
                type="button"
                onClick={() => navigate('/app/subscription-value')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                查看详情 →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-800">+35%</p>
                <p className="text-xs text-slate-500 mt-1">OEE提升</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">¥128.5万</p>
                <p className="text-xs text-slate-500 mt-1">年度节省</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">3.2x</p>
                <p className="text-xs text-slate-500 mt-1">ROI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Anomaly List & Sinan */}
        <div className="flex flex-col gap-6">
          {/* 异常列表 */}
          {selectedLine && <AnomalyList lineType={selectedLine.type} />}

          {/* Sinan Assistant Area */}
          <div className="h-64 relative">
            <SinanAvatar
              mode={sinanMode}
              alertMessage={alertMessage}
              className="h-full justify-end pb-4"
            />
          </div>
        </div>
      </div>

      {/* 3.2 优化路线：产品切换预警弹窗 */}
      <ProductChangeAlert
        visible={showProductAlert}
        currentProduct={productionPlan.productChangeWarning?.current_product || ''}
        nextProduct={productionPlan.productChangeWarning?.next_product || ''}
        differences={productionPlan.productChangeWarning?.flow_differences || []}
        onOptimize={() => {
          setShowProductAlert(false)
          handleOptimize({
            mode: 'product_switch',
            current_product_id: productionPlan.currentPlan?.product_id || '',
            next_product_id: productionPlan.nextPlan?.product_id || '',
            current_layout: { devices: [], workshopDimensions: { length: 100, width: 60 } },
            process_flow: { steps: [] },
            line_id: selectedLine?.id || '',
          })
        }}
        onDismiss={() => setShowProductAlert(false)}
      />
    </div>
  )
}

export default Dashboard
