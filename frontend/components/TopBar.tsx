import {
  AlertCircle,
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  User,
  Wifi,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface TopBarProps {
  title: string
  toggleSidebar: () => void
  breadcrumbs?: { label: string; path?: string }[]
}

type NotificationLevel = 'info' | 'warning' | 'critical'

interface SystemStatus {
  dataLink: 'good' | 'degraded' | 'offline'
  lastSync: string
}

const TopBar: React.FC<TopBarProps> = ({ title, toggleSidebar, breadcrumbs }) => {
  const { user, logout } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchFilter, setSearchFilter] = useState('设备ID')
  const [notificationLevel, setNotificationLevel] = useState<NotificationLevel>('info')
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    dataLink: 'good',
    lastSync: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  })

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // 模拟数据同步更新
      setSystemStatus((prev) => ({
        ...prev,
        lastSync: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗?')) {
      logout()
    }
  }

  const searchFilters = ['设备ID', '工单号', '产线名称', '物料编码']

  // 获取通知图标颜色
  const getNotificationColor = () => {
    switch (notificationLevel) {
      case 'critical':
        return 'text-red-500 animate-pulse'
      case 'warning':
        return 'text-orange-500'
      default:
        return 'text-slate-500 hover:text-blue-600'
    }
  }

  // 获取数据连接状态
  const getDataLinkStatus = () => {
    switch (systemStatus.dataLink) {
      case 'good':
        return { color: 'bg-green-500', text: '数据连接正常', icon: Wifi }
      case 'degraded':
        return { color: 'bg-yellow-500', text: '数据连接降级', icon: AlertCircle }
      case 'offline':
        return { color: 'bg-red-500', text: '数据连接断开', icon: AlertCircle }
    }
  }

  const dataLinkStatus = getDataLinkStatus()
  const StatusIcon = dataLinkStatus.icon

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      {/* 左侧: 菜单按钮 + 面包屑导航 */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* 面包屑导航 */}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.label} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && <ChevronRight size={14} className="text-slate-400" />}
                <button
                  type="button"
                  className={`text-sm transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'font-semibold text-slate-800'
                      : 'text-slate-500 hover:text-blue-600 cursor-pointer'
                  }`}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </nav>
        ) : (
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight truncate">{title}</h2>
        )}
      </div>

      {/* 右侧: 搜索 + 状态 + 通知 + 用户 */}
      <div className="flex items-center gap-4">
        {/* 全局搜索栏 (带筛选器) */}
        <div className="relative hidden lg:flex items-center gap-2">
          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-l-md text-xs font-medium text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            {searchFilters.map((filter) => (
              <option key={filter} value={filter}>
                {filter}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`搜索 ${searchFilter}...`}
              className="pl-9 pr-4 h-9 bg-slate-50 border border-l-0 border-slate-200 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 transition-all"
            />
          </div>
        </div>

        {/* 系统状态指示器 */}
        <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
          {/* 数据连接状态 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <StatusIcon size={14} className="text-slate-600" />
              <div
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${dataLinkStatus.color} rounded-full border border-white shadow-sm`}
              />
            </div>
            <span className="text-xs font-medium text-slate-600">{dataLinkStatus.text}</span>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-4 bg-slate-300" />

          {/* 最后同步时间 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">最后更新:</span>
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
              {systemStatus.lastSync}
            </span>
          </div>
        </div>

        {/* 帮助文档 */}
        <button
          type="button"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
          title="帮助文档"
        >
          <HelpCircle size={20} />
        </button>

        {/* 消息通知 (带级别指示) */}
        <button
          type="button"
          className={`relative p-2 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ${getNotificationColor()}`}
          title="消息通知"
        >
          <Bell size={20} />
          {notificationLevel === 'critical' ? (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-lg shadow-red-500/50" />
          ) : notificationLevel === 'warning' ? (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
          )}
        </button>

        {/* 用户信息 */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.full_name || user?.username || '用户'}
            </p>
            <p className="text-xs text-slate-500">{user?.role || '管理员'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white border-2 border-blue-200 shadow-sm">
              <User size={18} />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
