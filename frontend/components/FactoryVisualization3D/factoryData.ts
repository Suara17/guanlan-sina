import {
  FACTORY_DATA as LEGACY_FACTORY_DATA,
  type Station as LegacyStation,
  type Workshop as LegacyWorkshop,
} from '../FactoryVisualization/factoryData'

export type StatusType = 'running' | 'idle' | 'error'

export interface Station {
  id: string
  name: string
  type: string
  status: StatusType
  cycleTime: number
  position: number
}

export type IntegrationStatus = 'connected' | 'unconnected' | 'abnormal'

export interface StationConnectionDetails {
  line_name: string
  station_name: string
  integration_status: IntegrationStatus
  device_id: string | null
  device_name: string | null
  protocol: string | null
  connectivity_status: string | null
  last_communication_at: string | null
}

export interface WorkshopLine {
  id: string
  name: string
  type: string
  status: StatusType
  oee: number
  currentOrder: string
  stations: Station[]
}

export interface GridPosition {
  x: number
  y: number
}

export interface Workshop {
  id: string
  name: string
  status: StatusType
  lines: WorkshopLine[]
  gridPos: GridPosition
}

export interface Factory {
  id: string
  name: string
  position: [number, number, number]
  workshops: Workshop[]
  status: StatusType
}

export type GLOBAL_DATA = Factory[]

type FactoryProfile = 'stable' | 'baseline' | 'maintenance'

const getStatusWeight = (status: StatusType): number => {
  if (status === 'error') return 3
  if (status === 'running') return 2
  return 1
}

const normalizeStationType = (station: LegacyStation): string => {
  const source = `${station.name} ${station.type}`
  if (source.includes('上料')) return 'Loader'
  if (source.includes('印刷')) return 'Printer'
  if (source.includes('SPI')) return 'SPI'
  if (source.includes('贴片')) return 'Pick & Place'
  if (source.includes('回流焊')) return 'Reflow Oven'
  if (source.includes('AOI')) return 'AOI'
  if (
    source.includes('下料') ||
    source.includes('分板') ||
    source.includes('包装') ||
    source.includes('出料')
  ) {
    return 'Unloader'
  }
  return station.type
}

const transformStationStatus = (
  status: StatusType,
  profile: FactoryProfile,
  workshopIndex: number,
  lineIndex: number,
  stationIndex: number
): StatusType => {
  if (profile === 'stable') {
    return status === 'error' ? 'running' : status
  }

  if (profile === 'maintenance') {
    if (lineIndex === 1) return 'idle'
    if (workshopIndex === 2 && lineIndex === 2 && stationIndex === 3) return 'error'
    if (status === 'error') return 'idle'
    if (stationIndex % 5 === 0) return 'idle'
    return 'running'
  }

  return status
}

const deriveAggregateStatus = (statuses: StatusType[]): StatusType => {
  return statuses.reduce((current, next) => {
    return getStatusWeight(next) > getStatusWeight(current) ? next : current
  }, 'idle')
}

const mapWorkshops = (workshops: LegacyWorkshop[], factoryId: string, profile: FactoryProfile) => {
  return workshops.map((workshop, workshopIndex) => {
    const lines = workshop.lines.map((line, lineIndex) => {
      const stations = line.stations.map((station, stationIndex) => ({
        id: `${factoryId}-${line.id}-${station.id}`,
        name: station.name,
        type: normalizeStationType(station),
        status: transformStationStatus(
          station.status,
          profile,
          workshopIndex,
          lineIndex,
          stationIndex
        ),
        cycleTime: station.cycleTime,
        position: station.position,
      }))

      const lineStatus = deriveAggregateStatus(stations.map((station) => station.status))
      const oeeDelta = profile === 'stable' ? 5 : profile === 'maintenance' ? -8 : 0
      const nextOee = Math.max(45, Math.min(98, line.oee + oeeDelta))

      return {
        id: `${factoryId}-${line.id}`,
        name: line.name,
        type: line.type,
        status: lineStatus,
        oee: Number(nextOee.toFixed(1)),
        currentOrder: lineStatus === 'idle' ? '—' : line.currentOrder,
        stations,
      }
    })

    const workshopStatus = deriveAggregateStatus(lines.map((line) => line.status))
    return {
      id: `${factoryId}-${workshop.id}`,
      name: workshop.name,
      status: workshopStatus,
      lines,
      gridPos: {
        x: (workshop.gridPos.col - 1) * 25,
        y: workshop.gridPos.row * 16,
      },
    }
  })
}

const createFactory = (
  id: string,
  name: string,
  position: [number, number, number],
  profile: FactoryProfile
): Factory => {
  const workshops = mapWorkshops(LEGACY_FACTORY_DATA, id, profile)
  return {
    id,
    name,
    position,
    workshops,
    status: deriveAggregateStatus(workshops.map((workshop) => workshop.status)),
  }
}

export const GLOBAL_FACTORY_DATA: GLOBAL_DATA = [
  createFactory('factory-beijing', '北京工厂', [-72, 0, 0], 'stable'),
  createFactory('factory-tianjin', '天津工厂', [0, 0, 0], 'baseline'),
  createFactory('factory-hangzhou', '杭州工厂', [72, 0, 0], 'maintenance'),
]

export const MOCK_DATA = GLOBAL_FACTORY_DATA
