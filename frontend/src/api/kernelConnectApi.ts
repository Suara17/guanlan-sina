import axios from 'axios'

export interface KernelDiscoveredDevice {
  device_id: string
  name: string
  ip: string
  device_type: string
  protocol: string
  match_status: string
  connectivity_status: string
  last_communication_at: string | null
}

export interface ScanJobStatusResponse {
  scan_job_id: string
  status: 'running' | 'completed'
  progress: number
  discovered_count: number
  discovered_devices: KernelDiscoveredDevice[]
  started_at: string
  updated_at: string
}

export interface TopologyStation {
  station_id: string
  station_name: string
  station_type: string | null
}

export interface TopologyLine {
  line_id: string
  line_name: string
  factory_id: string
  stations: TopologyStation[]
}

export interface KernelBindingItem {
  device_id: string
  line_id: string
  station_id: string
}

export interface BatchBindingResponse {
  scan_job_id: string
  success_count: number
  failed_count: number
  failed_reasons: string[]
}

export interface KernelDiagnosisResponse {
  scan_job_id: string
  discovered_count: number
  bound_count: number
  unbound_device_ids: string[]
  failed_device_ids: string[]
  summary_status: 'none_found' | 'partial_success' | 'success'
  summary: string
  recommendations: string[]
  redirect_recommendations: string[]
}

export type KernelIntegrationStatus = 'connected' | 'unconnected' | 'abnormal'

export interface KernelVisualizationDeviceSnapshot {
  device_id: string
  device_name: string
  protocol: string
  connectivity_status: string
  last_communication_at: string | null
  integration_status: KernelIntegrationStatus
  line_id: string | null
  line_name: string | null
  station_id: string | null
  station_name: string | null
}

export interface KernelVisualizationSnapshot {
  scan_job_id: string
  summary_status: KernelDiagnosisResponse['summary_status']
  summary: string
  saved_at: string
  devices: KernelVisualizationDeviceSnapshot[]
}

export const KERNEL_VISUALIZATION_SNAPSHOT_STORAGE_KEY = 'kernel_visualization_snapshot_v1'
export const KERNEL_VISUALIZATION_UPDATED_EVENT = 'kernel-visualization-updated'

const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const kernelConnectApi = {
  async startScanJob(): Promise<{ scan_job_id: string; started_at: string; status: string }> {
    const response = await apiClient.post('/api/v1/kernel/scan-jobs')
    return response.data
  },

  async getScanJobStatus(scanJobId: string): Promise<ScanJobStatusResponse> {
    const response = await apiClient.get(`/api/v1/kernel/scan-jobs/${scanJobId}`)
    return response.data
  },

  async getTopology(): Promise<TopologyLine[]> {
    const response = await apiClient.get('/api/v1/kernel/topology')
    return response.data
  },

  async batchBindDevices(scanJobId: string, bindings: KernelBindingItem[]): Promise<BatchBindingResponse> {
    const response = await apiClient.post('/api/v1/kernel/bindings:batch', {
      scan_job_id: scanJobId,
      bindings,
    })
    return response.data
  },

  async getDiagnosisReport(scanJobId: string): Promise<KernelDiagnosisResponse> {
    const response = await apiClient.get(`/api/v1/kernel/diagnosis-reports/${scanJobId}`)
    return response.data
  },
}
