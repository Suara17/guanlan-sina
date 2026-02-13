import { AlertCircle, AlertTriangle, CheckCircle2, Info, Terminal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '../types/zhixing'

interface Props {
  logs: LogEntry[]
  isLive?: boolean
}

export function RealTimeLogs({ logs, isLive = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(isAtBottom)
    }
  }

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      default:
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
    }
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-700 bg-red-50'
      case 'warning':
        return 'text-amber-700 bg-amber-50'
      case 'success':
        return 'text-green-700 bg-green-50'
      default:
        return 'text-slate-700 bg-slate-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800">实时监控日志</h3>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              实时
            </span>
          )}
          {!autoScroll && (
            <button
              onClick={() => setAutoScroll(true)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              滚动到底部
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm bg-slate-900"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-8">暂无日志</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-3 p-2 rounded ${getLevelColor(log.level)}`}
            >
              <span className="text-slate-400 text-xs whitespace-nowrap">
                {formatTimestamp(log.timestamp)}
              </span>
              {getLevelIcon(log.level)}
              <span className="text-slate-500 text-xs">[{log.source}]</span>
              <span className="flex-1 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
