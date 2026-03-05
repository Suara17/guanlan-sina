import {
  Activity,
  ArrowLeft,
  Box,
  ChevronRight,
  Factory,
  Globe,
  RotateCcw,
  Wifi,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type KernelVisualizationSnapshot,
  KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY,
  KERNEL_VISUALIZATION_UPDATED_EVENT,
} from '../../src/api/kernelConnectApi'
import { FactoryScene } from './FactoryScene'
import type { StationConnectionDetails } from './factoryData'
import { useFactoryStore } from './store'

interface FactoryVisualization3DProps {
  className?: string
}

const getStatusLabel = (status: 'running' | 'idle' | 'error'): string => {
  if (status === 'running') return '运行中'
  if (status === 'idle') return '待机'
  return '故障'
}

const normalizeName = (value: string) => value.replace(/\s+/g, '').toLowerCase()

const getIntegrationLabel = (status: StationConnectionDetails['integration_status']) => {
  if (status === 'connected') return '已接入'
  if (status === 'abnormal') return '异常'
  return '未接入'
}

const getIntegrationDotClass = (status: StationConnectionDetails['integration_status']) => {
  if (status === 'connected') return 'bg-emerald-500'
  if (status === 'abnormal') return 'bg-red-500'
  return 'bg-slate-400'
}

const formatDateTimeLabel = (iso: string | null) => {
  if (!iso) return '未上报'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '未上报'
  return date.toLocaleString('zh-CN', { hour12: false })
}

export const FactoryVisualization3D: React.FC<FactoryVisualization3DProps> = ({ className }) => {
  const { level, selectedFactory, selectedWorkshop, selectedLine, goBack, resetToGlobalView } =
    useFactoryStore()
  const [snapshot, setSnapshot] = useState<KernelVisualizationSnapshot | null>(null)
  const [selectedStationConnection, setSelectedStationConnection] =
    useState<StationConnectionDetails | null>(null)

  useEffect(() => {
    const readSnapshot = () => {
      try {
        const raw = localStorage.getItem(KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY)
        if (!raw) {
          setSnapshot(null)
          return
        }
        const parsed = JSON.parse(raw) as KernelVisualizationSnapshot
        if (!Array.isArray(parsed.devices)) {
          setSnapshot(null)
          return
        }
        setSnapshot(parsed)
      } catch (error) {
        console.warn('读取内核接入快照失败:', error)
        setSnapshot(null)
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY) {
        readSnapshot()
      }
    }

    readSnapshot()
    window.addEventListener('storage', onStorage)
    window.addEventListener(KERNEL_VISUALIZATION_UPDATED_EVENT, readSnapshot)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(KERNEL_VISUALIZATION_UPDATED_EVENT, readSnapshot)
    }
  }, [])

  const stationConnectionMap = useMemo(() => {
    const statusWeight: Record<StationConnectionDetails['integration_status'], number> = {
      connected: 2,
      unconnected: 1,
      abnormal: 3,
    }

    const map = new Map<string, StationConnectionDetails>()
    snapshot?.devices.forEach((device) => {
      if (!device.line_name || !device.station_name) return
      const key = `${normalizeName(device.line_name)}::${normalizeName(device.station_name)}`
      const nextValue: StationConnectionDetails = {
        line_name: device.line_name,
        station_name: device.station_name,
        integration_status: device.integration_status,
        device_id: device.device_id,
        device_name: device.device_name,
        protocol: device.protocol,
        connectivity_status: device.connectivity_status,
        last_communication_at: device.last_communication_at,
      }
      const current = map.get(key)
      if (!current || statusWeight[nextValue.integration_status] >= statusWeight[current.integration_status]) {
        map.set(key, nextValue)
      }
    })
    return map
  }, [snapshot])

  const resolveStationConnection = useCallback(
    (lineName: string, stationName: string): StationConnectionDetails => {
      const key = `${normalizeName(lineName)}::${normalizeName(stationName)}`
      const matched = stationConnectionMap.get(key)
      if (matched) return matched
      return {
        line_name: lineName,
        station_name: stationName,
        integration_status: 'unconnected',
        device_id: null,
        device_name: null,
        protocol: null,
        connectivity_status: null,
        last_communication_at: null,
      }
    },
    [stationConnectionMap]
  )

  const integrationStats = useMemo(() => {
    return (snapshot?.devices || []).reduce(
      (acc, device) => {
        acc[device.integration_status] += 1
        return acc
      },
      { connected: 0, unconnected: 0, abnormal: 0 }
    )
  }, [snapshot])

  return (
    <div className={`relative h-full w-full flex flex-col ${className || ''}`}>
      {/* Header / Breadcrumbs */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200">
        <button
          type="button"
          onClick={resetToGlobalView}
          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'global' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
        >
          <Globe size={16} />
          <span>全局</span>
        </button>

        {level !== 'global' && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <button
              type="button"
              onClick={() =>
                selectedFactory && useFactoryStore.getState().drillDownToFactory(selectedFactory)
              }
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'factory' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
            >
              <Factory size={16} />
              <span>{selectedFactory?.name || '工厂'}</span>
            </button>
          </>
        )}

        {(level === 'workshop' || level === 'line') && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <button
              type="button"
              onClick={() =>
                selectedWorkshop && useFactoryStore.getState().drillDownToWorkshop(selectedWorkshop)
              }
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'workshop' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
            >
              <Box size={16} />
              <span>{selectedWorkshop?.name || '车间'}</span>
            </button>
          </>
        )}

        {level === 'line' && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <div className="flex items-center gap-2 px-2 py-1 font-bold text-blue-600">
              <Activity size={16} />
              <span>{selectedLine?.name || '产线'}</span>
            </div>
          </>
        )}
      </div>

      {/* 快捷控制 */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={resetToGlobalView}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-md hover:bg-slate-50"
        >
          <RotateCcw size={14} />
          重置视角
        </button>
        {level !== 'global' && (
          <button
            type="button"
            onClick={goBack}
            className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
            aria-label="返回上一级"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      {/* 3D Scene */}
      <div className="flex-1">
        <FactoryScene
          resolveStationConnection={resolveStationConnection}
          onSelectStationConnection={setSelectedStationConnection}
        />
      </div>

      {/* Legend / Info Panel */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 text-sm">
        <h4 className="font-bold text-slate-800 mb-2">状态图例</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
            <span className="text-slate-600">{getStatusLabel('running')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
            <span className="text-slate-600">{getStatusLabel('idle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <span className="text-slate-600">{getStatusLabel('error')}</span>
          </div>
        </div>
        <div className="h-px bg-slate-200 my-3" />
        <h4 className="font-bold text-slate-800 mb-2">接入图例</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">已接入</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700">{integrationStats.connected}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-slate-600">未接入</span>
            </div>
            <span className="text-xs font-semibold text-slate-600">{integrationStats.unconnected}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600">异常</span>
            </div>
            <span className="text-xs font-semibold text-red-700">{integrationStats.abnormal}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {snapshot
            ? `数据时间：${formatDateTimeLabel(snapshot.saved_at)}`
            : '暂无接入快照，请先在 OS 内核接入页完成绑定。'}
        </p>
      </div>

      {selectedStationConnection && (
        <div className="absolute bottom-4 right-4 z-10 max-w-sm bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 text-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-bold text-slate-800">接入详情</h4>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                selectedStationConnection.integration_status === 'connected'
                  ? 'bg-emerald-50 text-emerald-700'
                  : selectedStationConnection.integration_status === 'abnormal'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${getIntegrationDotClass(selectedStationConnection.integration_status)}`}
              />
              {getIntegrationLabel(selectedStationConnection.integration_status)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-xs">
            <span className="text-slate-500">产线</span>
            <span className="text-slate-700">{selectedStationConnection.line_name}</span>
            <span className="text-slate-500">工位</span>
            <span className="text-slate-700">{selectedStationConnection.station_name}</span>
            <span className="text-slate-500">设备</span>
            <span className="text-slate-700">{selectedStationConnection.device_name || '未绑定设备'}</span>
            <span className="text-slate-500">协议</span>
            <span className="text-slate-700">{selectedStationConnection.protocol || '未配置'}</span>
            <span className="text-slate-500">通信状态</span>
            <span className="text-slate-700">{selectedStationConnection.connectivity_status || '未知'}</span>
            <span className="text-slate-500">最后通信</span>
            <span className="text-slate-700">
              {formatDateTimeLabel(selectedStationConnection.last_communication_at)}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <Wifi size={12} />
            点击其他工位可切换查看
          </div>
        </div>
      )}

      {level === 'line' && !selectedStationConnection && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 shadow">
          点击工位查看接入详情
        </div>
      )}
    </div>
  )
}

export default FactoryVisualization3D
