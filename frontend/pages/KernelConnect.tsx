import {
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Link2,
  Loader2,
  Network,
  Server,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type BatchBindingResponse,
  KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY,
  KERNEL_VISUALIZATION_UPDATED_EVENT,
  type KernelDiagnosisResponse,
  type KernelDiscoveredDevice,
  type KernelIntegrationStatus,
  type KernelVisualizationDeviceSnapshot,
  type KernelVisualizationSnapshot,
  kernelConnectApi,
  type TopologyLine,
} from '../src/api/kernelConnectApi'

interface DeviceBindingSelection {
  line_id: string
  station_id: string
}

interface ExistingDeviceBinding {
  line_id: string
  line_name: string
  station_id: string
  station_name: string
}

interface BindingOverrideConflict {
  device_id: string
  device_name: string
  previous_label: string
}

type PhaseNoticeTone = 'info' | 'success' | 'warning' | 'error'

interface PhaseNotice {
  id: number
  tone: PhaseNoticeTone
  title: string
  message: string
  step: number
}

type KernelUiStatus = 'scan_failure' | 'none_found' | 'partial_success' | 'success'

interface KernelStatusTemplate {
  title: string
  summary: string
  suggestions: string[]
}

const KERNEL_STATUS_TEMPLATES: Record<KernelUiStatus, KernelStatusTemplate> = {
  scan_failure: {
    title: '扫描失败',
    summary: '未能完成设备扫描，请先排查网络与网段配置。',
    suggestions: ['重试扫描任务', '检查网段配置', '核对工位映射'],
  },
  none_found: {
    title: '未发现设备',
    summary: '当前网段未发现可接入设备。',
    suggestions: ['重试扫描任务', '检查网段配置', '核对工位映射'],
  },
  partial_success: {
    title: '部分成功',
    summary: '部分设备已接入，仍有设备未闭环。',
    suggestions: ['重试扫描任务', '检查网段配置', '核对工位映射'],
  },
  success: {
    title: '接入成功',
    summary: '设备接入与工位绑定均已完成。',
    suggestions: ['前往生产可视化核对状态', '前往实时监控确认在线情况', '核对工位映射'],
  },
}

const STEP_LABELS = ['设备扫描', '协议匹配', '绑定产线/工位', '诊断报告'] as const

const formatTimeLabel = (iso?: string | null) => {
  if (!iso) return '未上报'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '未上报'
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

const buildSuggestedBindingSelections = (
  devices: KernelDiscoveredDevice[],
  topology: TopologyLine[]
) => {
  const nextSelections: Record<string, DeviceBindingSelection> = {}
  if (topology.length === 0) return nextSelections

  devices.forEach((device, index) => {
    const line = topology[index % topology.length]
    const station = line.stations[0]
    if (!station) return
    nextSelections[device.device_id] = {
      line_id: line.line_id,
      station_id: station.station_id,
    }
  })

  return nextSelections
}

const persistKernelVisualizationSnapshot = ({
  scanJobId,
  devices,
  topology,
  bindingSelections,
  diagnosis,
}: {
  scanJobId: string
  devices: KernelDiscoveredDevice[]
  topology: TopologyLine[]
  bindingSelections: Record<string, DeviceBindingSelection>
  diagnosis: KernelDiagnosisResponse
}) => {
  try {
    const lineById = new Map(topology.map((line) => [line.line_id, line]))
    const failedDeviceIds = new Set(diagnosis.failed_device_ids)
    const unboundDeviceIds = new Set(diagnosis.unbound_device_ids)

    const snapshotDevices: KernelVisualizationDeviceSnapshot[] = devices.map((device) => {
      const selected = bindingSelections[device.device_id]
      const line = selected?.line_id ? lineById.get(selected.line_id) : undefined
      const station = selected?.station_id
        ? line?.stations.find((item) => item.station_id === selected.station_id)
        : undefined

      let integrationStatus: KernelIntegrationStatus = 'unconnected'
      if (failedDeviceIds.has(device.device_id) || device.connectivity_status !== 'online') {
        integrationStatus = 'abnormal'
      } else if (
        selected?.line_id &&
        selected?.station_id &&
        !unboundDeviceIds.has(device.device_id)
      ) {
        integrationStatus = 'connected'
      }

      return {
        device_id: device.device_id,
        device_name: device.name,
        protocol: device.protocol,
        connectivity_status: device.connectivity_status,
        last_communication_at: device.last_communication_at,
        integration_status: integrationStatus,
        line_id: selected?.line_id || null,
        line_name: line?.line_name || null,
        station_id: selected?.station_id || null,
        station_name: station?.station_name || null,
      }
    })

    const snapshot: KernelVisualizationSnapshot = {
      scan_job_id: scanJobId,
      summary_status: diagnosis.summary_status,
      summary: diagnosis.summary,
      saved_at: new Date().toISOString(),
      devices: snapshotDevices,
    }

    localStorage.setItem(KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot))
    window.dispatchEvent(new Event(KERNEL_VISUALIZATION_UPDATED_EVENT))
  } catch (error) {
    console.warn('保存可视化接入快照失败:', error)
  }
}

const KernelConnect: React.FC = () => {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [scanJobId, setScanJobId] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [devices, setDevices] = useState<KernelDiscoveredDevice[]>([])
  const [topology, setTopology] = useState<TopologyLine[]>([])
  const [bindingSelections, setBindingSelections] = useState<
    Record<string, DeviceBindingSelection>
  >({})
  const [bindingSubmitting, setBindingSubmitting] = useState(false)
  const [bindingResult, setBindingResult] = useState<BatchBindingResponse | null>(null)
  const [diagnosisReport, setDiagnosisReport] = useState<KernelDiagnosisResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uiStatus, setUiStatus] = useState<KernelUiStatus | null>(null)
  const [step, setStep] = useState(1)
  const [demoMode, setDemoMode] = useState(true)
  const [phaseNotice, setPhaseNotice] = useState<PhaseNotice | null>(null)
  const [keyword, setKeyword] = useState('')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all')
  const [protocolFilter, setProtocolFilter] = useState('all')

  const currentStepLabel = STEP_LABELS[step - 1] || STEP_LABELS[0]

  const pushPhaseNotice = useCallback(
    (tone: PhaseNoticeTone, title: string, message: string, targetStep: number) => {
      setPhaseNotice({
        id: Date.now(),
        tone,
        title,
        message,
        step: targetStep,
      })
    },
    []
  )

  useEffect(() => {
    if (!phaseNotice) return
    const timer = setTimeout(() => {
      setPhaseNotice((current) => (current?.id === phaseNotice.id ? null : current))
    }, 3600)

    return () => clearTimeout(timer)
  }, [phaseNotice])

  const resetWizard = () => {
    setScanning(false)
    setScanJobId(null)
    setScanProgress(0)
    setDevices([])
    setTopology([])
    setBindingSelections({})
    setBindingSubmitting(false)
    setBindingResult(null)
    setDiagnosisReport(null)
    setErrorMessage(null)
    setUiStatus(null)
    setPhaseNotice(null)
    setStep(1)
  }

  const startScan = async () => {
    try {
      setErrorMessage(null)
      setDevices([])
      setScanProgress(0)
      setBindingSelections({})
      setBindingResult(null)
      setDiagnosisReport(null)
      setUiStatus(null)

      const response = await kernelConnectApi.startScanJob()
      setScanJobId(response.scan_job_id)
      setScanning(true)
      setStep(1)
      pushPhaseNotice('info', '扫描任务已启动', '系统正在分段扫描网段与协议特征。', 1)
    } catch (error) {
      console.error('启动扫描失败:', error)
      setErrorMessage(KERNEL_STATUS_TEMPLATES.scan_failure.summary)
      setUiStatus('scan_failure')
      setScanning(false)
      pushPhaseNotice('error', '扫描任务启动失败', '请检查网络环境后重试扫描任务。', 1)
    }
  }

  useEffect(() => {
    if (!scanning || !scanJobId) return

    let timer: ReturnType<typeof setInterval> | null = null
    let active = true

    const pollScanStatus = async () => {
      try {
        const status = await kernelConnectApi.getScanJobStatus(scanJobId)
        if (!active) return

        setScanProgress(status.progress)
        setDevices(status.discovered_devices)

        if (status.status === 'completed') {
          setScanning(false)
          setStep(2)
          pushPhaseNotice(
            'success',
            '扫描完成',
            `已发现 ${status.discovered_devices.length} 台设备，进入协议匹配阶段。`,
            2
          )
          if (timer) {
            clearInterval(timer)
          }
        }
      } catch (error) {
        console.error('拉取扫描状态失败:', error)
        if (!active) return
        setErrorMessage(KERNEL_STATUS_TEMPLATES.scan_failure.summary)
        setUiStatus('scan_failure')
        setScanning(false)
        pushPhaseNotice('error', '扫描状态拉取失败', '请稍后重试，或检查后端扫描服务状态。', 1)
        if (timer) {
          clearInterval(timer)
        }
      }
    }

    void pollScanStatus()
    timer = setInterval(() => {
      void pollScanStatus()
    }, 800)

    return () => {
      active = false
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [scanning, scanJobId, pushPhaseNotice])

  const enterBindingStep = async () => {
    try {
      setErrorMessage(null)
      const data = await kernelConnectApi.getTopology()
      setTopology(data)
      setStep(3)
      const stationCount = data.reduce((total, line) => total + line.stations.length, 0)
      pushPhaseNotice(
        'info',
        '拓扑加载完成',
        `已载入 ${data.length} 条产线、${stationCount} 个工位，开始设备绑定。`,
        3
      )
    } catch (error) {
      console.error('加载产线拓扑失败:', error)
      setErrorMessage('加载产线拓扑失败，请稍后重试。')
      setUiStatus('partial_success')
      pushPhaseNotice('warning', '拓扑加载失败', '产线拓扑读取异常，请重试后继续。', 2)
    }
  }

  const updateLineSelection = (deviceId: string, lineId: string) => {
    setBindingSelections((prev) => ({
      ...prev,
      [deviceId]: {
        line_id: lineId,
        station_id: '',
      },
    }))
  }

  const updateStationSelection = (deviceId: string, stationId: string) => {
    setBindingSelections((prev) => ({
      ...prev,
      [deviceId]: {
        line_id: prev[deviceId]?.line_id || '',
        station_id: stationId,
      },
    }))
  }

  const deviceTypeOptions = useMemo(() => {
    return Array.from(new Set(devices.map((item) => item.device_type))).sort((a, b) =>
      a.localeCompare(b, 'zh-CN')
    )
  }, [devices])

  const protocolOptions = useMemo(() => {
    return Array.from(new Set(devices.map((item) => item.protocol))).sort((a, b) =>
      a.localeCompare(b, 'zh-CN')
    )
  }, [devices])

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      if (deviceTypeFilter !== 'all' && device.device_type !== deviceTypeFilter) return false
      if (protocolFilter !== 'all' && device.protocol !== protocolFilter) return false
      if (!normalizedKeyword) return true
      const searchTarget = `${device.device_id} ${device.name} ${device.ip}`.toLowerCase()
      return searchTarget.includes(normalizedKeyword)
    })
  }, [devices, deviceTypeFilter, protocolFilter, normalizedKeyword])

  const hasActiveFilter =
    deviceTypeFilter !== 'all' || protocolFilter !== 'all' || keyword.trim() !== ''

  const duplicateDeviceIds = useMemo(() => {
    const counter = new Map<string, number>()
    devices.forEach((device) => {
      counter.set(device.device_id, (counter.get(device.device_id) || 0) + 1)
    })
    return Array.from(counter.entries())
      .filter(([, count]) => count > 1)
      .map(([deviceId]) => deviceId)
  }, [devices])

  const duplicateDeviceIdSet = useMemo(() => new Set(duplicateDeviceIds), [duplicateDeviceIds])

  const canSubmitBinding = useMemo(() => {
    if (devices.length === 0) return false
    if (duplicateDeviceIds.length > 0) return false
    return devices.every((device) => {
      const selected = bindingSelections[device.device_id]
      return !!selected?.line_id && !!selected?.station_id
    })
  }, [devices, bindingSelections, duplicateDeviceIds])

  const existingBindingsByDevice = useMemo(() => {
    try {
      const raw = localStorage.getItem(KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY)
      if (!raw) return new Map<string, ExistingDeviceBinding>()
      const snapshot = JSON.parse(raw) as KernelVisualizationSnapshot
      if (!Array.isArray(snapshot.devices)) return new Map<string, ExistingDeviceBinding>()

      const map = new Map<string, ExistingDeviceBinding>()
      snapshot.devices.forEach((device) => {
        if (!device.line_id || !device.station_id || !device.line_name || !device.station_name)
          return
        map.set(device.device_id, {
          line_id: device.line_id,
          line_name: device.line_name,
          station_id: device.station_id,
          station_name: device.station_name,
        })
      })
      return map
    } catch (error) {
      console.warn('读取历史绑定快照失败:', error)
      return new Map<string, ExistingDeviceBinding>()
    }
  }, [])

  const bindingOverrideConflicts = useMemo(() => {
    const conflicts: BindingOverrideConflict[] = []
    devices.forEach((device) => {
      const selected = bindingSelections[device.device_id]
      if (!selected?.line_id || !selected?.station_id) return

      const existing = existingBindingsByDevice.get(device.device_id)
      if (!existing) return
      if (existing.line_id === selected.line_id && existing.station_id === selected.station_id)
        return

      conflicts.push({
        device_id: device.device_id,
        device_name: device.name,
        previous_label: `${existing.line_name} / ${existing.station_name}`,
      })
    })
    return conflicts
  }, [devices, bindingSelections, existingBindingsByDevice])

  const bindingOverrideConflictMap = useMemo(() => {
    return new Map(bindingOverrideConflicts.map((item) => [item.device_id, item]))
  }, [bindingOverrideConflicts])

  const submitBinding = async () => {
    if (!scanJobId) return
    if (duplicateDeviceIds.length > 0) {
      setErrorMessage(
        `检测到重复设备ID：${duplicateDeviceIds.join('、')}。请重新扫描后再提交绑定。`
      )
      return
    }

    if (bindingOverrideConflicts.length > 0) {
      const confirmed = window.confirm(
        `检测到 ${bindingOverrideConflicts.length} 台设备将覆盖历史绑定，是否继续提交？`
      )
      if (!confirmed) {
        return
      }
    }

    try {
      setBindingSubmitting(true)
      setErrorMessage(null)

      const bindings = devices.map((device) => ({
        device_id: device.device_id,
        line_id: bindingSelections[device.device_id]?.line_id || '',
        station_id: bindingSelections[device.device_id]?.station_id || '',
      }))

      const result = await kernelConnectApi.batchBindDevices(scanJobId, bindings)
      setBindingResult(result)

      const diagnosis = await kernelConnectApi.getDiagnosisReport(scanJobId)
      setDiagnosisReport(diagnosis)
      if (diagnosis.summary_status === 'success') {
        setUiStatus('success')
      } else if (diagnosis.summary_status === 'partial_success') {
        setUiStatus('partial_success')
      } else {
        setUiStatus('none_found')
      }
      persistKernelVisualizationSnapshot({
        scanJobId,
        devices,
        topology,
        bindingSelections,
        diagnosis,
      })
      setStep(4)
      if (diagnosis.summary_status === 'success') {
        pushPhaseNotice(
          'success',
          '接入闭环完成',
          `已完成 ${diagnosis.bound_count}/${diagnosis.discovered_count} 台设备绑定。`,
          4
        )
      } else {
        pushPhaseNotice(
          'warning',
          '接入结果为部分成功',
          '诊断报告已生成，请根据建议继续排查未闭环设备。',
          4
        )
      }
    } catch (error) {
      console.error('提交设备绑定失败:', error)
      setErrorMessage('提交设备绑定失败，请检查后重试。')
      setUiStatus('partial_success')
      pushPhaseNotice('error', '绑定提交失败', '请检查工位映射与网络状态后重试。', 3)
    } finally {
      setBindingSubmitting(false)
    }
  }

  const getStationsByLineId = (lineId: string) => {
    const line = topology.find((item) => item.line_id === lineId)
    return line?.stations || []
  }

  const boundDeviceCount = useMemo(() => {
    return devices.filter((device) => {
      const selected = bindingSelections[device.device_id]
      return !!selected?.line_id && !!selected?.station_id
    }).length
  }, [devices, bindingSelections])

  const filteredBoundDeviceCount = useMemo(() => {
    return filteredDevices.filter((device) => {
      const selected = bindingSelections[device.device_id]
      return !!selected?.line_id && !!selected?.station_id
    }).length
  }, [filteredDevices, bindingSelections])

  const bindingCompletion =
    devices.length > 0 ? Math.round((boundDeviceCount / devices.length) * 100) : 0

  const applySuggestedBinding = () => {
    const nextSelections = buildSuggestedBindingSelections(devices, topology)
    if (Object.keys(nextSelections).length === 0) return
    setBindingSelections(nextSelections)
    pushPhaseNotice('info', '建议绑定已生成', '已按拓扑顺序生成建议工位，可直接提交或手动调整。', 3)
  }

  const resetFilter = () => {
    setKeyword('')
    setDeviceTypeFilter('all')
    setProtocolFilter('all')
  }

  const diagnosisTemplate = useMemo(() => {
    if (!diagnosisReport) return null
    if (diagnosisReport.summary_status === 'success') return KERNEL_STATUS_TEMPLATES.success
    if (diagnosisReport.summary_status === 'partial_success')
      return KERNEL_STATUS_TEMPLATES.partial_success
    return KERNEL_STATUS_TEMPLATES.none_found
  }, [diagnosisReport])

  useEffect(() => {
    if (!demoMode || step !== 3 || devices.length === 0 || topology.length === 0) return
    if (boundDeviceCount > 0) return

    const suggestedSelections = buildSuggestedBindingSelections(devices, topology)
    const suggestedCount = Object.keys(suggestedSelections).length
    if (suggestedCount === 0) return

    setBindingSelections(suggestedSelections)
    pushPhaseNotice(
      'info',
      '演示模式自动建议绑定',
      `已自动为 ${suggestedCount} 台设备生成绑定建议，支持继续手工调整。`,
      3
    )
  }, [demoMode, step, devices, topology, boundDeviceCount, pushPhaseNotice])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">OS 内核接入控制台</h1>
        <p className="text-slate-500 mt-2">
          扫描工业设备、完成协议匹配并回挂到产线工位，形成可追踪的接入闭环。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">扫描任务</div>
          <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-2">
            <Network size={15} className="text-blue-600" />
            {scanJobId ? scanJobId.slice(0, 8) : '未启动'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">发现设备</div>
          <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-2">
            <Server size={15} className="text-indigo-600" />
            {devices.length} 台
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">绑定完成率</div>
          <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-2">
            <Link2 size={15} className="text-emerald-600" />
            {bindingCompletion}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">当前阶段</div>
          <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-2">
            <ClipboardCheck size={15} className="text-amber-600" />
            {step === 4 ? '诊断完成' : currentStepLabel}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">演示模式</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                demoMode ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {demoMode ? '已启用' : '已关闭'}
            </span>
            <button
              type="button"
              onClick={() => setDemoMode((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                demoMode ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              aria-pressed={demoMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  demoMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {phaseNotice && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            phaseNotice.tone === 'success'
              ? 'bg-emerald-50 border-emerald-100'
              : phaseNotice.tone === 'warning'
                ? 'bg-amber-50 border-amber-100'
                : phaseNotice.tone === 'error'
                  ? 'bg-red-50 border-red-100'
                  : 'bg-blue-50 border-blue-100'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p
                className={`text-sm font-semibold ${
                  phaseNotice.tone === 'success'
                    ? 'text-emerald-800'
                    : phaseNotice.tone === 'warning'
                      ? 'text-amber-800'
                      : phaseNotice.tone === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                }`}
              >
                {phaseNotice.title}
              </p>
              <p
                className={`text-xs mt-1 ${
                  phaseNotice.tone === 'success'
                    ? 'text-emerald-700'
                    : phaseNotice.tone === 'warning'
                      ? 'text-amber-700'
                      : phaseNotice.tone === 'error'
                        ? 'text-red-700'
                        : 'text-blue-700'
                }`}
              >
                {phaseNotice.message}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                phaseNotice.tone === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : phaseNotice.tone === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : phaseNotice.tone === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
              }`}
            >
              阶段：{STEP_LABELS[phaseNotice.step - 1] || STEP_LABELS[0]}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 py-4 text-center text-sm font-medium ${
                step === s
                  ? 'bg-white text-blue-700'
                  : step > s
                    ? 'text-blue-600'
                    : 'text-slate-400'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
                  step === s
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110 transition-all'
                    : step > s
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-200 text-white'
                }`}
              >
                {s}
              </span>
              {STEP_LABELS[s - 1]}
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8 min-h-[460px]">
          {step === 1 && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 transition-all duration-500 ${
                    scanning
                      ? 'bg-blue-100 shadow-[0_0_0_12px_rgba(59,130,246,0.12)]'
                      : 'bg-blue-50'
                  }`}
                >
                  {scanning ? <Loader2 className="animate-spin" size={32} /> : <Wifi size={32} />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {scanning ? '正在扫描局域网...' : '准备开始内核接入'}
                </h3>
                <p className="text-slate-500 mb-5">系统将自动发现支持 Modbus/OPC UA 协议的设备。</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50/70">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">扫描进度</span>
                  <span className="font-semibold text-slate-700">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ${
                      scanning ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="mt-3 text-xs text-slate-500">已发现设备：{devices.length} 台</div>
              </div>

              {devices.length > 0 && (
                <div className="rounded-xl border border-slate-200 mb-6 overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-100">
                    实时发现列表
                  </div>
                  <div className="divide-y divide-slate-100">
                    {devices.map((dev) => (
                      <div
                        key={dev.device_id}
                        className="px-4 py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{dev.name}</p>
                          <p className="text-xs text-slate-500">
                            {dev.ip} · {dev.protocol}
                          </p>
                        </div>
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          已发现
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={startScan}
                  disabled={scanning}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-all"
                >
                  {scanning ? '扫描中...' : '开始扫描'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  协议匹配结果（当前显示 {filteredDevices.length} / {devices.length} 台）
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  匹配成功率 100%
                </span>
              </div>
              {duplicateDeviceIds.length > 0 && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  检测到重复设备 ID：{duplicateDeviceIds.join('、')}。请重新扫描，避免重复绑定冲突。
                </div>
              )}

              <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_180px_200px_auto] gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="搜索设备名称 / 设备ID / IP"
                />
                <select
                  value={deviceTypeFilter}
                  onChange={(event) => setDeviceTypeFilter(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">全部类型</option>
                  {deviceTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={protocolFilter}
                  onChange={(event) => setProtocolFilter(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">全部协议</option>
                  {protocolOptions.map((protocol) => (
                    <option key={protocol} value={protocol}>
                      {protocol}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={resetFilter}
                  disabled={!hasActiveFilter}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  重置筛选
                </button>
              </div>

              {filteredDevices.length === 0 ? (
                <div className="mb-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  当前筛选条件下无设备，请调整关键词或过滤项。
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
                  {filteredDevices.map((dev, index) => (
                    <div
                      key={`${dev.device_id}-${dev.ip}-${index}`}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                            <Server size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{dev.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {dev.device_id} · {dev.ip}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
                            <CheckCircle size={12} />
                            协议已匹配
                          </span>
                          {duplicateDeviceIdSet.has(dev.device_id) && (
                            <span className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded-full">
                              重复设备
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">
                          {dev.protocol}
                        </span>
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                          {dev.device_type}
                        </span>
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                          最后通信 {formatTimeLabel(dev.last_communication_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetWizard}
                  className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  重试
                </button>
                <button
                  type="button"
                  onClick={enterBindingStep}
                  className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                >
                  下一步：绑定产线/工位
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">绑定到产线/工位</h3>
                <p className="text-sm text-slate-500 mb-6">
                  为每台设备选择所属产线与工位，提交后写入生产拓扑。
                </p>

                {demoMode && (
                  <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-700">
                    演示模式已启用：进入绑定阶段后会自动生成建议映射，你可以直接提交，也可以手动微调。
                  </div>
                )}

                {duplicateDeviceIds.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                    检测到重复设备 ID：{duplicateDeviceIds.join('、')}
                    。请先重新扫描，否则禁止提交绑定。
                  </div>
                )}

                {bindingOverrideConflicts.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
                    检测到 {bindingOverrideConflicts.length}{' '}
                    台设备与历史绑定不一致，提交时会提示你确认是否覆盖。
                  </div>
                )}

                <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_180px_200px_auto] gap-3">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="搜索设备名称 / 设备ID / IP"
                  />
                  <select
                    value={deviceTypeFilter}
                    onChange={(event) => setDeviceTypeFilter(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">全部类型</option>
                    {deviceTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={protocolFilter}
                    onChange={(event) => setProtocolFilter(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">全部协议</option>
                    {protocolOptions.map((protocol) => (
                      <option key={protocol} value={protocol}>
                        {protocol}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={resetFilter}
                    disabled={!hasActiveFilter}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    重置筛选
                  </button>
                </div>

                {filteredDevices.length === 0 ? (
                  <div className="mb-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    当前筛选条件下无设备，请调整关键词或过滤项。
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {filteredDevices.map((device, index) => {
                      const selected = bindingSelections[device.device_id]
                      const stations = selected?.line_id
                        ? getStationsByLineId(selected.line_id)
                        : []
                      const overrideConflict = bindingOverrideConflictMap.get(device.device_id)
                      const lineSelectId = `line-${device.device_id}-${index}`
                      const stationSelectId = `station-${device.device_id}-${index}`
                      return (
                        <div
                          key={`${device.device_id}-${device.ip}-${index}`}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-800">{device.name}</p>
                              <p className="text-xs text-slate-500">
                                {device.device_id} · {device.ip}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {!!selected?.line_id && !!selected?.station_id ? (
                                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                                  已绑定
                                </span>
                              ) : (
                                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                                  待绑定
                                </span>
                              )}
                              {duplicateDeviceIdSet.has(device.device_id) && (
                                <span className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded-full">
                                  重复设备
                                </span>
                              )}
                              {overrideConflict && (
                                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                                  将覆盖历史绑定
                                </span>
                              )}
                            </div>
                          </div>
                          {overrideConflict && (
                            <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                              历史绑定位置：{overrideConflict.previous_label}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor={lineSelectId}
                                className="block text-xs text-slate-500 mb-1"
                              >
                                选择产线
                              </label>
                              <select
                                id={lineSelectId}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={selected?.line_id || ''}
                                onChange={(event) =>
                                  updateLineSelection(device.device_id, event.target.value)
                                }
                              >
                                <option value="">请选择产线</option>
                                {topology.map((line) => (
                                  <option key={line.line_id} value={line.line_id}>
                                    {line.line_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor={stationSelectId}
                                className="block text-xs text-slate-500 mb-1"
                              >
                                选择工位
                              </label>
                              <select
                                id={stationSelectId}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={selected?.station_id || ''}
                                onChange={(event) =>
                                  updateStationSelection(device.device_id, event.target.value)
                                }
                                disabled={!selected?.line_id}
                              >
                                <option value="">请选择工位</option>
                                {stations.map((station) => (
                                  <option key={station.station_id} value={station.station_id}>
                                    {station.station_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {hasActiveFilter && (
                  <div className="mb-4 text-xs text-slate-500">
                    当前仅显示 {filteredDevices.length} 台设备，提交绑定将作用于全部{' '}
                    {devices.length} 台设备。
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    上一步
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmitBinding || bindingSubmitting}
                    onClick={submitBinding}
                    className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                  >
                    {bindingSubmitting ? '提交中...' : '提交绑定并生成诊断报告'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 h-fit">
                <h4 className="font-semibold text-slate-800 mb-3">绑定质量看板</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">当前显示</span>
                    <span className="font-semibold text-slate-800">
                      {filteredDevices.length} 台
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">总设备</span>
                    <span className="font-semibold text-slate-800">{devices.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">已绑定</span>
                    <span className="font-semibold text-emerald-700">{boundDeviceCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">当前显示已绑定</span>
                    <span className="font-semibold text-emerald-700">
                      {filteredBoundDeviceCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">待绑定</span>
                    <span className="font-semibold text-amber-700">
                      {devices.length - boundDeviceCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">覆盖冲突</span>
                    <span className="font-semibold text-amber-700">
                      {bindingOverrideConflicts.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">重复设备</span>
                    <span className="font-semibold text-red-700">{duplicateDeviceIds.length}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-1">完成度 {bindingCompletion}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${bindingCompletion}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applySuggestedBinding}
                  className="mt-4 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
                >
                  一键建议绑定
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  基于当前拓扑按顺序分配到默认工位，可再手工微调。
                </p>
              </div>
            </div>
          )}

          {step === 4 && diagnosisReport && (
            <div className="w-full max-w-4xl mx-auto text-left animate-in zoom-in-95 duration-500">
              <div
                className={`p-4 rounded-xl flex items-center gap-3 mb-5 ${
                  (uiStatus || diagnosisReport.summary_status) === 'success'
                    ? 'bg-emerald-50 border border-emerald-100'
                    : 'bg-amber-50 border border-amber-100'
                }`}
              >
                {(uiStatus || diagnosisReport.summary_status) === 'success' ? (
                  <ShieldCheck className="text-emerald-600" size={20} />
                ) : (
                  <AlertCircle className="text-amber-600" size={20} />
                )}
                <span
                  className={`font-medium ${
                    (uiStatus || diagnosisReport.summary_status) === 'success'
                      ? 'text-emerald-800'
                      : 'text-amber-800'
                  }`}
                >
                  {diagnosisTemplate?.summary || diagnosisReport.summary}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">已发现设备</p>
                  <p className="text-2xl font-mono text-slate-900">
                    {diagnosisReport.discovered_count}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">已绑定设备</p>
                  <p className="text-2xl font-mono text-emerald-700">
                    {diagnosisReport.bound_count}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">未闭环设备</p>
                  <p className="text-2xl font-mono text-amber-700">
                    {diagnosisReport.unbound_device_ids.length +
                      diagnosisReport.failed_device_ids.length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
                  接入诊断报告
                </h4>
                <div className="space-y-3">
                  {diagnosisReport.unbound_device_ids.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded text-sm text-amber-800">
                      未绑定设备：{diagnosisReport.unbound_device_ids.join(', ')}
                    </div>
                  )}
                  {diagnosisReport.failed_device_ids.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800">
                      绑定失败设备：{diagnosisReport.failed_device_ids.join(', ')}
                    </div>
                  )}
                  {(diagnosisTemplate?.suggestions || diagnosisReport.recommendations).map(
                    (item, index) => (
                      <div
                        key={`${diagnosisReport.scan_job_id}-${item}`}
                        className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800"
                      >
                        {index + 1}. {item}
                      </div>
                    )
                  )}
                </div>

                {bindingResult && bindingResult.failed_count > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    <p className="font-semibold mb-2">绑定失败明细：</p>
                    {bindingResult.failed_reasons.map((reason, index) => (
                      <p key={`${bindingResult.scan_job_id}-${reason}`}>
                        {index + 1}. {reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/app/')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Network size={14} />
                    前往生产可视化
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/app/zhixing')}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-2"
                  >
                    <ClipboardCheck size={14} />
                    前往实时监控
                  </button>
                  <button
                    type="button"
                    onClick={resetWizard}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    重新扫描
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="max-w-4xl mx-auto mt-5 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
              <p className="font-semibold mb-1">
                {uiStatus ? KERNEL_STATUS_TEMPLATES[uiStatus].title : '处理失败'}
              </p>
              <p>{errorMessage}</p>
              <div className="mt-2 text-xs text-red-600">
                {(uiStatus
                  ? KERNEL_STATUS_TEMPLATES[uiStatus].suggestions
                  : KERNEL_STATUS_TEMPLATES.scan_failure.suggestions
                ).join(' · ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KernelConnect
