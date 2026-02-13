import { Activity, Cpu, Gauge, Settings, Wifi, WifiOff } from 'lucide-react'
import type { MachineComponent, MachineDiagram } from '../types/zhixing'

interface Props {
  diagram: MachineDiagram
  highlightedComponentId?: string
}

export function MachineDiagram({ diagram, highlightedComponentId }: Props) {
  const getStatusColor = (status: MachineComponent['status']) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'offline':
        return 'text-gray-500 bg-gray-50 border-gray-200'
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getStatusIcon = (status: MachineComponent['status']) => {
    switch (status) {
      case 'normal':
        return <Activity className="w-4 h-4" />
      case 'warning':
        return <Gauge className="w-4 h-4" />
      case 'error':
        return <WifiOff className="w-4 h-4" />
      case 'offline':
        return <Wifi className="w-4 h-4" />
      default:
        return <Cpu className="w-4 h-4" />
    }
  }

  const getComponentIcon = (type: MachineComponent['type']) => {
    switch (type) {
      case 'actuator':
        return <Settings className="w-3 h-3" />
      case 'sensor':
        return <Gauge className="w-3 h-3" />
      case 'controller':
        return <Cpu className="w-3 h-3" />
      default:
        return <Activity className="w-3 h-3" />
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">示意图</h3>
            <p className="text-sm text-slate-500">
              {diagram.machine_name} | 型号: {diagram.model}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              正常
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              警告
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              异常
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 relative bg-slate-50">
        <svg viewBox="0 0 400 300" className="w-full h-full" style={{ minHeight: '250px' }}>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.1" />
            </filter>
          </defs>

          <rect
            x="50"
            y="50"
            width="300"
            height="200"
            rx="10"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          <text x="200" y="35" textAnchor="middle" className="text-xs fill-slate-500 font-medium">
            {diagram.machine_name}
          </text>

          {diagram.components.map((comp) => {
            const isHighlighted = comp.id === highlightedComponentId
            const statusColors = {
              normal: { fill: '#dcfce7', stroke: '#22c55e' },
              warning: { fill: '#fef3c7', stroke: '#f59e0b' },
              error: { fill: '#fee2e2', stroke: '#ef4444' },
              offline: { fill: '#f1f5f9', stroke: '#94a3b8' },
            }
            const colors = statusColors[comp.status]

            return (
              <g key={comp.id}>
                <circle
                  cx={comp.position?.x || 100}
                  cy={comp.position?.y || 100}
                  r={isHighlighted ? 28 : 24}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isHighlighted ? 3 : 2}
                  filter="url(#shadow)"
                  className="transition-all duration-300"
                />
                <text
                  x={comp.position?.x || 100}
                  y={(comp.position?.y || 100) + 4}
                  textAnchor="middle"
                  className="text-xs fill-slate-700 font-medium pointer-events-none"
                >
                  {comp.name.substring(0, 3)}
                </text>
                {comp.value && (
                  <text
                    x={comp.position?.x || 100}
                    y={(comp.position?.y || 100) + 40}
                    textAnchor="middle"
                    className="text-xs fill-slate-500"
                  >
                    {comp.value}
                  </text>
                )}
              </g>
            )
          })}

          <line
            x1="150"
            y1="100"
            x2="300"
            y2="150"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <line
            x1="300"
            y1="150"
            x2="150"
            y2="200"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <line
            x1="150"
            y1="200"
            x2="300"
            y2="250"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <line
            x1="300"
            y1="250"
            x2="150"
            y2="100"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        </svg>
      </div>

      <div className="p-4 border-t border-slate-100 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {diagram.components.map((comp) => (
            <div
              key={comp.id}
              className={`p-2 rounded-lg border ${getStatusColor(comp.status)} ${
                comp.id === highlightedComponentId ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getComponentIcon(comp.type)}
                  <span className="text-xs font-medium">{comp.name}</span>
                </div>
                {getStatusIcon(comp.status)}
              </div>
              {comp.description && <p className="text-xs mt-1 opacity-75">{comp.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
