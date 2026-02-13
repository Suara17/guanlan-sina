export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ExecutionTask {
  task_id: string
  solution_id: string
  solution_name: string
  status: ExecutionStatus
  progress: number
  current_step: number
  total_steps: number
  started_at?: string
  completed_at?: string
  estimated_remaining_time?: number
}

export interface ExecutionStep {
  step_id: number
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  duration?: number
  description?: string
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  source: string
}

export interface MachineComponent {
  id: string
  name: string
  type: 'actuator' | 'sensor' | 'controller' | 'mechanical' | 'other'
  status: 'normal' | 'warning' | 'error' | 'offline'
  position?: { x: number; y: number }
  value?: string
  unit?: string
  description?: string
}

export interface MachineDiagram {
  machine_id: string
  machine_name: string
  model: string
  components: MachineComponent[]
  image_url?: string
  schematic_url?: string
}

export interface ExecutionResult {
  success: boolean
  message: string
  final_metrics?: {
    name: string
    value: number
    unit: string
  }[]
}
