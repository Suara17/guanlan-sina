import { ArrowLeft, CheckCircle2, Cpu, Gauge, Network, Zap } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import YikongLogo from '../components/YikongLogo'

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
}

interface Metric {
  value: string
  label: string
}

const DongweiPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState<number>(0)

  const features: Feature[] = [
    {
      icon: Network,
      title: '边缘计算架构',
      description: '在数据源头进行预处理，大幅降低网络带宽消耗，毫秒级响应延迟。',
    },
    {
      icon: Gauge,
      title: '高精度采集',
      description: '支持微秒级时间戳精度，采样率可达100kHz，精准捕捉设备细微波动。',
    },
    {
      icon: Cpu,
      title: '智能初筛算法',
      description: '内置异常检测算法，自动过滤无效数据，只上传关键告警信息。',
    },
    {
      icon: Zap,
      title: '实时流处理',
      description: '基于流计算引擎，实现数据实时处理分析，第一时间发现生产异常。',
    },
  ]

  const metrics: Metric[] = [
    { value: '< 1ms', label: '端到端延迟' },
    { value: '100kHz', label: '最高采样率' },
    { value: '99.99%', label: '系统可用性' },
    { value: '80%', label: '数据过滤率' },
  ]

  const scenarios = [
    { title: '设备状态监测', desc: '实时感知设备振动、温度、电流等关键参数' },
    { title: '异常预警', desc: '基于历史数据建模，提前预测设备故障' },
    { title: '工艺参数优化', desc: '采集工艺参数，辅助工艺工程师优化设置' },
    { title: '能耗管理', desc: '监测设备能耗，发现异常能耗点' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* 动态网格背景 */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      ></div>

      {/* 导航栏 */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-white hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">返回首页</span>
            </button>
            <YikongLogo size={40} variant="light" />
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* 主体内容 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Hero 部分 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight flex items-center justify-center gap-4">
            <Zap size={48} className="text-blue-400" />
            洞微
          </h1>

          {/* 描述 + 指标整合 */}
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              毫秒级数据采集，洞察设备细微波动。通过边缘计算实现数据初筛，构建工厂第一级感知网。
            </p>

            {/* 核心指标 - 横向排列 */}
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">{metric.value}</span>
                  <span className="text-slate-500 text-sm">{metric.label}</span>
                  {index < metrics.length - 1 && <span className="text-slate-700">|</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 核心功能 */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-4">核心能力</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            四大核心能力，构建工厂第一级感知网络
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isActive = activeFeature === index
              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveFeature(index)}
                  className={`group relative rounded-2xl border-2 overflow-hidden transition-all duration-500 cursor-pointer p-8 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:border-blue-500/30'
                  }`}
                >
                  <div
                    className={`mb-4 p-3 rounded-xl w-fit transition-colors ${
                      isActive ? 'bg-blue-500/20' : 'bg-slate-800'
                    }`}
                  >
                    <Icon size={28} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                  </div>
                  <h3
                    className={`text-xl font-bold mb-2 transition-colors ${isActive ? 'text-white' : 'text-slate-200'}`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed transition-colors ${isActive ? 'text-slate-300' : 'text-slate-400'}`}
                  >
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 应用场景 */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-4">应用场景</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            广泛适用于各类工业制造场景
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-2">{scenario.title}</h3>
                <p className="text-slate-400 text-sm">{scenario.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 优势 */}
        <div className="mb-20">
          <div className="bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20 border border-blue-500/30 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">为什么选择洞微？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: '超低延迟', desc: '端到端延迟小于1ms，实时响应生产变化' },
                { title: '高可靠性', desc: '99.99%系统可用性，保障生产连续性' },
                { title: '智能过滤', desc: 'AI算法自动过滤无效数据，降低存储成本' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <CheckCircle2 size={40} className="text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-300 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 弈控经纬 Yikong Jingwei. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default DongweiPage
