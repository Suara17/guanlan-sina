import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Cpu,
  Factory,
  Gauge,
  Layers,
  Play,
  Power,
  Settings,
  Shield,
  Thermometer,
  Timer,
  TrendingUp,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TiangongLogo from '../components/TiangongLogo'

interface DeviceStatus {
  id: string
  name: string
  status: 'running' | 'warning' | 'offline' | 'maintenance'
  efficiency: number
  temperature: number
  uptime: number
}

interface AlarmItem {
  id: string
  level: 'critical' | 'warning' | 'info'
  device: string
  message: string
  time: string
}

interface MetricData {
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  color: string
}

const MonitoringDemo: React.FC = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLive, setIsLive] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  // 模拟实时数据
  const [metrics, setMetrics] = useState<MetricData[]>([
    { label: '整体OEE', value: 87.5, unit: '%', trend: 'up', color: 'emerald' },
    { label: '生产效率', value: 94.2, unit: '%', trend: 'stable', color: 'blue' },
    { label: '设备可用率', value: 96.8, unit: '%', trend: 'up', color: 'cyan' },
    { label: '能耗指数', value: 78.3, unit: 'kWh', trend: 'down', color: 'amber' },
  ])

  const [devices] = useState<DeviceStatus[]>([
    {
      id: '1',
      name: 'CNC加工中心-A01',
      status: 'running',
      efficiency: 92,
      temperature: 45,
      uptime: 156,
    },
    {
      id: '2',
      name: '焊接机器人-B02',
      status: 'running',
      efficiency: 88,
      temperature: 52,
      uptime: 142,
    },
    {
      id: '3',
      name: 'AGV搬运车-C03',
      status: 'warning',
      efficiency: 75,
      temperature: 38,
      uptime: 98,
    },
    {
      id: '4',
      name: '注塑机-D04',
      status: 'running',
      efficiency: 95,
      temperature: 68,
      uptime: 189,
    },
    {
      id: '5',
      name: '检测设备-E05',
      status: 'maintenance',
      efficiency: 0,
      temperature: 25,
      uptime: 0,
    },
    {
      id: '6',
      name: '包装线-F06',
      status: 'running',
      efficiency: 91,
      temperature: 35,
      uptime: 167,
    },
  ])

  const [alarms] = useState<AlarmItem[]>([
    {
      id: '1',
      level: 'warning',
      device: 'AGV搬运车-C03',
      message: '电池电量低于20%，建议充电',
      time: '2分钟前',
    },
    {
      id: '2',
      level: 'info',
      device: 'CNC加工中心-A01',
      message: '刀具磨损检测：建议48小时内更换',
      time: '15分钟前',
    },
    {
      id: '3',
      level: 'critical',
      device: '注塑机-D04',
      message: '模具温度过高：当前68°C',
      time: '23分钟前',
    },
    {
      id: '4',
      level: 'info',
      device: '焊接机器人-B02',
      message: '完成批次 #2024-0215 生产',
      time: '45分钟前',
    },
  ])

  // 模拟实时数据更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      if (isLive) {
        setMetrics((prev) =>
          prev.map((m) => ({
            ...m,
            value: m.value + (Math.random() - 0.5) * 2,
            trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : m.trend,
          }))
        )
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [isLive])

  const getStatusColor = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'running':
        return 'bg-emerald-500'
      case 'warning':
        return 'bg-amber-500'
      case 'offline':
        return 'bg-slate-400'
      case 'maintenance':
        return 'bg-blue-500'
    }
  }

  const getStatusText = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'running':
        return '运行中'
      case 'warning':
        return '告警'
      case 'offline':
        return '离线'
      case 'maintenance':
        return '维护中'
    }
  }

  const getAlarmIcon = (level: AlarmItem['level']) => {
    switch (level) {
      case 'critical':
        return <XCircle className="text-red-500" size={18} />
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={18} />
      case 'info':
        return <Bell className="text-blue-500" size={18} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white font-sans">
      {/* 动态网格背景 */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* 光晕效果 */}
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-blue-500/30 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />

      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">返回首页</span>
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="flex items-center gap-2">
              <TiangongLogo size={28} variant="dark" animate={true} />
              <span className="font-bold text-lg tracking-tight">天工·弈控</span>
              <span className="text-slate-400 text-sm ml-2">| 实时监控演示</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* 实时状态指示器 */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}
              />
              <span className="text-sm text-slate-300">{isLive ? '实时更新中' : '已暂停'}</span>
            </div>

            {/* 当前时间 */}
            <div className="text-sm font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              {currentTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>

            {/* 控制按钮 */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-slate-300 border border-white/20 hover:bg-white/20'
              }`}
            >
              {isLive ? '暂停' : '继续'}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              登录系统
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="pt-20 px-6 lg:px-10 pb-8 relative z-10">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">{metric.label}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    metric.trend === 'up'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : metric.trend === 'down'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-3xl font-black ${
                    metric.color === 'emerald'
                      ? 'text-emerald-400'
                      : metric.color === 'blue'
                        ? 'text-blue-400'
                        : metric.color === 'cyan'
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                  }`}
                >
                  {metric.value.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">{metric.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 主内容区域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧 - 设备状态概览 */}
          <div className="col-span-3 space-y-4">
            {/* 设备状态统计 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Factory size={16} className="text-blue-400" /> 设备状态概览
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '运行中', count: 4, color: 'emerald', bg: 'bg-emerald-500/20' },
                  { label: '告警', count: 1, color: 'amber', bg: 'bg-amber-500/20' },
                  { label: '维护', count: 1, color: 'blue', bg: 'bg-blue-500/20' },
                  { label: '离线', count: 0, color: 'slate', bg: 'bg-slate-500/20' },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
                    <div className={`text-2xl font-black text-${item.color}-400`}>{item.count}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Settings size={16} className="text-cyan-400" /> 快速操作
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all text-left group">
                  <Play
                    size={18}
                    className="text-emerald-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm text-emerald-300">启动全部设备</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all text-left group">
                  <Power
                    size={18}
                    className="text-red-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm text-red-300">紧急停止</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all text-left group">
                  <Shield
                    size={18}
                    className="text-blue-400 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm text-blue-300">安全巡检</span>
                </button>
              </div>
            </div>

            {/* 系统状态 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Wifi size={16} className="text-cyan-400" /> 系统状态
              </h3>
              <div className="space-y-3">
                {[
                  { label: '数据采集服务', status: 'online', latency: '12ms' },
                  { label: '消息队列', status: 'online', latency: '8ms' },
                  { label: '数据库连接', status: 'online', latency: '5ms' },
                  { label: 'AI推理引擎', status: 'online', latency: '45ms' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{item.latency}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-400">在线</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 中央 - 数字孪生视图 */}
          <div className="col-span-6 space-y-4">
            {/* 设备网格 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Layers size={18} className="text-white" />
                  </div>
                  <div>
                    <span className="font-semibold">数字孪生视图</span>
                    <span className="text-xs text-slate-500 ml-2">实时同步</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />6 台设备
                  </span>
                </div>
              </div>

              {/* 设备网格 */}
              <div className="p-5 grid grid-cols-3 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    onClick={() =>
                      setSelectedDevice(selectedDevice === device.id ? null : device.id)
                    }
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      selectedDevice === device.id ? 'scale-105 z-10' : ''
                    }`}
                  >
                    <div
                      className={`rounded-xl border-2 p-4 flex flex-col transition-all ${
                        selectedDevice === device.id
                          ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      {/* 状态指示灯 */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(device.status)} animate-pulse`}
                        />
                        <span className="text-xs text-slate-400">
                          {getStatusText(device.status)}
                        </span>
                      </div>

                      {/* 设备图标 */}
                      <div className="flex-1 flex items-center justify-center py-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            device.status === 'running'
                              ? 'bg-emerald-500/20'
                              : device.status === 'warning'
                                ? 'bg-amber-500/20'
                                : device.status === 'maintenance'
                                  ? 'bg-blue-500/20'
                                  : 'bg-slate-700/50'
                          }`}
                        >
                          <Cpu
                            size={28}
                            className={
                              device.status === 'running'
                                ? 'text-emerald-400'
                                : device.status === 'warning'
                                  ? 'text-amber-400'
                                  : device.status === 'maintenance'
                                    ? 'text-blue-400'
                                    : 'text-slate-500'
                            }
                          />
                        </div>
                      </div>

                      {/* 设备信息 */}
                      <div className="mt-2 space-y-2">
                        <div className="text-sm font-semibold truncate">{device.name}</div>
                        {device.status === 'running' && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">效率</span>
                              <span className="text-emerald-400">{device.efficiency}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                                style={{ width: `${device.efficiency}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Thermometer size={12} /> {device.temperature}°C
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer size={12} /> {device.uptime}h
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 图例 */}
              <div className="px-5 py-3 border-t border-white/10 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">运行中</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-400">告警</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-400">维护</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <span className="text-slate-400">离线</span>
                </div>
              </div>
            </div>

            {/* 趋势图 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 产量趋势 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-400" /> 产量趋势
                  </h3>
                  <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                    +12.5% vs 昨日
                  </span>
                </div>
                <div className="h-28 flex items-end gap-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all duration-500 hover:from-blue-500 hover:to-cyan-300"
                      style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-xs text-slate-500">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>

              {/* 能耗分析 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" /> 能耗分析
                  </h3>
                  <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                    -8.3% vs 昨日
                  </span>
                </div>
                <div className="h-28 flex items-end gap-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-500 hover:from-amber-500 hover:to-amber-300"
                      style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-xs text-slate-500">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 - 告警和数据统计 */}
          <div className="col-span-3 space-y-4">
            {/* 告警面板 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" /> 实时告警
                </h3>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                  {alarms.filter((a) => a.level === 'critical').length} 紧急
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {getAlarmIcon(alarm.level)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{alarm.device}</div>
                        <div className="text-xs text-slate-500 mt-1">{alarm.message}</div>
                        <div className="text-xs text-slate-600 mt-2">{alarm.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 数据采集统计 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" /> 数据采集
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="text-2xl font-black text-blue-400">1.2M</div>
                  <div className="text-xs text-slate-500 mt-1">数据点/分钟</div>
                </div>
                <div className="text-center p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <div className="text-2xl font-black text-cyan-400">856</div>
                  <div className="text-xs text-slate-500 mt-1">采集点位</div>
                </div>
                <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="text-2xl font-black text-emerald-400">99.9%</div>
                  <div className="text-xs text-slate-500 mt-1">采集成功率</div>
                </div>
                <div className="text-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="text-2xl font-black text-amber-400">12ms</div>
                  <div className="text-xs text-slate-500 mt-1">平均延迟</div>
                </div>
              </div>
            </div>

            {/* 功能演示提示 */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-300">体验完整功能</div>
                  <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                    登录系统后可查看实时数据、配置告警规则、操作设备等更多功能。
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    立即登录{' '}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoringDemo
