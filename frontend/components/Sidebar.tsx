import {
  Activity,
  Cable,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Cuboid,
  Factory,
  LayoutDashboard,
  MonitorPlay,
  Settings,
  Sparkles,
  Store,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { NavGroup, NavItem } from '../types'
import TiangongLogo from './TiangongLogo'

interface SidebarProps {
  currentPath: string
  onNavigate: (path: string) => void
  isOpen: boolean
}

// 功能分组配置
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'monitoring',
    label: '实时监控',
    items: [
      {
        id: 'dashboard',
        label: '生产可视化',
        icon: LayoutDashboard,
        path: '/app/',
        group: 'monitoring',
      },
      {
        id: 'sinan',
        label: '司南智控',
        icon: Sparkles,
        path: '/app/sinan',
        group: 'monitoring',
      },
    ],
  },
  {
    id: 'subscription',
    label: '订阅模块',
    items: [
      {
        id: 'tianchou',
        label: '天筹优化',
        icon: Cpu,
        path: '/app/tianchou',
        group: 'subscription',
      },
      {
        id: 'huntian',
        label: '浑天仿真',
        icon: MonitorPlay,
        path: '/app/huntian',
        group: 'subscription',
      },
    ],
  },
  {
    id: 'components',
    label: '组件管理',
    items: [
      {
        id: 'marketplace',
        label: '能力商店',
        icon: Store,
        path: '/app/marketplace',
        group: 'components',
      },
      {
        id: 'builder',
        label: '场景编排',
        icon: Cuboid,
        path: '/app/builder',
        group: 'components',
      },
      {
        id: 'ecosystem',
        label: '开发者生态',
        icon: Activity,
        path: '/app/ecosystem',
        group: 'components',
      },
    ],
  },
  {
    id: 'system',
    label: '系统维护',
    items: [
      {
        id: 'kernel',
        label: 'OS 内核接入',
        icon: Cable,
        path: '/app/kernel',
        group: 'system',
      },
    ],
  },
]

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isOpen }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [factoryDropdownOpen, setFactoryDropdownOpen] = useState(false)
  const [selectedFactory, setSelectedFactory] = useState('苏州一厂')

  const factories = ['苏州一厂', '苏州二厂', '越南工厂', '深圳研发中心']

  return (
    <aside
      className={`fixed lg:relative z-30 h-full bg-slate-900 text-white transition-all duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Logo 区域 + 工厂切换器 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {/* 折叠时仅显示LOGO图标(居中) */}
        {collapsed ? (
          <TiangongLogo size={32} className="mx-auto" />
        ) : (
          /* 展开时显示完整LOGO + 标题 + 工厂切换 */
          <div className="flex items-center flex-1 min-w-0">
            <TiangongLogo size={32} className="mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0 relative">
              <button
                type="button"
                onClick={() => setFactoryDropdownOpen(!factoryDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm tracking-wide truncate">天工·弈控</div>
                  <div className="text-xs text-slate-400 truncate group-hover:text-blue-400 transition-colors">
                    {selectedFactory}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 group-hover:text-blue-400 transition-all flex-shrink-0 ${
                    factoryDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 工厂切换下拉菜单 */}
              {factoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {factories.map((factory) => (
                    <button
                      key={factory}
                      type="button"
                      onClick={() => {
                        setSelectedFactory(factory)
                        setFactoryDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-2 ${
                        selectedFactory === factory
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-slate-300'
                      }`}
                    >
                      <Factory size={14} className="flex-shrink-0" />
                      <span className="truncate">{factory}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 折叠按钮 */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 导航菜单 */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {/* 分组标题 */}
            {!collapsed && (
              <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.label}
              </div>
            )}

            {/* 菜单项 */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.path
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/90 to-blue-500/80 text-white shadow-lg shadow-blue-900/50'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* 左侧光条 */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full shadow-lg shadow-blue-400/50" />
                    )}

                    <Icon
                      size={20}
                      className={`flex-shrink-0 transition-all ${
                        isActive
                          ? 'text-white drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                          : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {!collapsed && (
                      <>
                        <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white/50 flex-shrink-0" />
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 系统设置 */}
      <div className="p-4 border-t border-slate-800">
        <button
          type="button"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer group ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? '系统设置' : undefined}
        >
          <Settings
            size={20}
            className="flex-shrink-0 group-hover:rotate-90 transition-transform duration-300"
          />
          {!collapsed && <span className="font-medium text-sm">系统设置</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
