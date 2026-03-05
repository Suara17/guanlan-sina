/* biome-ignore-all lint/suspicious/noArrayIndexKey: 设备细节网格按固定顺序渲染，索引键不会影响业务状态。 */
import { Box, Cylinder, Html } from '@react-three/drei'
import type React from 'react'
import { useState } from 'react'
import type { Station, StationConnectionDetails, StatusType } from '../factoryData'
import { STATUS_COLORS } from '../utils/materials'

interface Station3DProps {
  station: Station
  position?: [number, number, number]
  onClick?: () => void
  connection: StationConnectionDetails
  onSelectConnection?: (details: StationConnectionDetails) => void
}

const getStatusLabel = (status: 'running' | 'idle' | 'error'): string => {
  if (status === 'running') return '运行中'
  if (status === 'idle') return '待机'
  return '故障'
}

const getMachineTypeLabel = (type: string): string => {
  const dict: Record<string, string> = {
    Loader: '上料设备',
    Printer: '印刷设备',
    SPI: 'SPI检测',
    'Pick & Place': '贴片设备',
    'Reflow Oven': '回流焊设备',
    AOI: 'AOI检测',
    Unloader: '下料设备',
  }
  return dict[type] || type
}

const INTEGRATION_COLORS: Record<StationConnectionDetails['integration_status'], string> = {
  connected: '#22c55e',
  unconnected: '#94a3b8',
  abnormal: '#ef4444',
}

const getIntegrationLabel = (status: StationConnectionDetails['integration_status']) => {
  if (status === 'connected') return '已接入'
  if (status === 'abnormal') return '异常'
  return '未接入'
}

const formatLastCommunication = (iso: string | null) => {
  if (!iso) return '未上报'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '未上报'
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

// Industrial Signal Tower (Andon Light)
const SignalTower = ({
  status,
  position,
}: {
  status: StatusType
  position: [number, number, number]
}) => {
  const colors = {
    red: status === 'error' ? '#ef4444' : '#7f1d1d',
    yellow: status === 'idle' ? '#eab308' : '#713f12',
    green: status === 'running' ? '#22c55e' : '#14532d',
  }

  return (
    <group position={position}>
      <Cylinder args={[0.05, 0.05, 0.6]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#1f2937" />
      </Cylinder>
      {/* Green Light */}
      <Cylinder args={[0.06, 0.06, 0.15]} position={[0, 0.5, 0]}>
        <meshStandardMaterial
          color={colors.green}
          emissive={colors.green}
          emissiveIntensity={status === 'running' ? 2 : 0}
        />
      </Cylinder>
      {/* Yellow Light */}
      <Cylinder args={[0.06, 0.06, 0.15]} position={[0, 0.35, 0]}>
        <meshStandardMaterial
          color={colors.yellow}
          emissive={colors.yellow}
          emissiveIntensity={status === 'idle' ? 2 : 0}
        />
      </Cylinder>
      {/* Red Light */}
      <Cylinder args={[0.06, 0.06, 0.15]} position={[0, 0.2, 0]}>
        <meshStandardMaterial
          color={colors.red}
          emissive={colors.red}
          emissiveIntensity={status === 'error' ? 2 : 0}
        />
      </Cylinder>
    </group>
  )
}

// Monitor Arm with Screen
const MonitorArm = ({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) => (
  <group position={position} rotation={rotation}>
    {/* Arm */}
    <Box args={[0.05, 0.05, 0.3]} position={[0, 0, 0.15]}>
      <meshStandardMaterial color="#374151" />
    </Box>
    {/* Screen */}
    <Box args={[0.5, 0.3, 0.05]} position={[0, 0.1, 0.3]} rotation={[-0.3, 0, 0]}>
      <meshStandardMaterial color="#111827" />
    </Box>
    {/* Screen Glow */}
    <Box args={[0.45, 0.25, 0.01]} position={[0, 0.1, 0.33]} rotation={[-0.3, 0, 0]}>
      <meshBasicMaterial color="#0ea5e9" />
    </Box>
  </group>
)

// Safety Glass Door
const SafetyDoor = ({
  width,
  height,
  position,
}: {
  width: number
  height: number
  position: [number, number, number]
}) => (
  <group position={position}>
    {/* Frame */}
    <Box args={[width, height, 0.05]}>
      <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
    </Box>
    {/* Glass */}
    <Box args={[width - 0.1, height - 0.1, 0.06]}>
      <meshPhysicalMaterial
        color="#e0f2fe"
        metalness={0.1}
        roughness={0}
        transmission={0.6}
        transparent
        opacity={0.3}
      />
    </Box>
  </group>
)

export const Station3D: React.FC<Station3DProps> = ({
  station,
  position = [0, 0, 0],
  onClick,
  connection,
  onSelectConnection,
}) => {
  const [hovered, setHovered] = useState(false)

  const renderMachineGeometry = () => {
    switch (station.type) {
      case 'Loader':
      case 'Unloader':
        return (
          <group>
            {/* Base Frame */}
            <Box args={[1.2, 0.1, 1.0]} position={[0, 0.05, 0]}>
              <meshStandardMaterial color="#374151" />
            </Box>
            {/* Vertical Columns */}
            <Box args={[0.1, 1.5, 0.1]} position={[-0.5, 0.75, 0.4]}>
              <meshStandardMaterial color="#9ca3af" />
            </Box>
            <Box args={[0.1, 1.5, 0.1]} position={[0.5, 0.75, 0.4]}>
              <meshStandardMaterial color="#9ca3af" />
            </Box>
            <Box args={[0.1, 1.5, 0.1]} position={[-0.5, 0.75, -0.4]}>
              <meshStandardMaterial color="#9ca3af" />
            </Box>
            <Box args={[0.1, 1.5, 0.1]} position={[0.5, 0.75, -0.4]}>
              <meshStandardMaterial color="#9ca3af" />
            </Box>
            {/* Magazine Rack (Yellow) */}
            <Box args={[0.8, 0.8, 0.6]} position={[0, 0.8, 0]}>
              <meshStandardMaterial color="#fcd34d" wireframe />
            </Box>
            {/* Control Panel */}
            <Box args={[0.3, 0.4, 0.1]} position={[0.6, 1.0, 0.4]} rotation={[0, -0.5, 0]}>
              <meshStandardMaterial color="#d1d5db" />
            </Box>
          </group>
        )
      case 'Printer':
        return (
          <group>
            {/* Main Body */}
            <Box args={[1.4, 1.2, 1.2]} position={[0, 0.6, 0]}>
              <meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.5} />
            </Box>
            {/* Top Cover (Blue Accent) */}
            <Box args={[1.4, 0.3, 1.2]} position={[0, 1.35, 0]}>
              <meshStandardMaterial color="#1d4ed8" roughness={0.2} />
            </Box>
            {/* Safety Window */}
            <SafetyDoor width={0.8} height={0.6} position={[0, 0.8, 0.61]} />
            {/* Monitor */}
            <MonitorArm position={[0.5, 1.3, 0.6]} rotation={[0, -0.3, 0]} />
          </group>
        )
      case 'Pick & Place':
        return (
          <group>
            {/* Main Body */}
            <Box args={[2.2, 1.4, 1.4]} position={[0, 0.7, 0]}>
              <meshStandardMaterial color="#f3f4f6" roughness={0.3} metalness={0.4} />
            </Box>
            {/* Feeder Banks (Detailed) */}
            <group position={[0, 0.8, 0.75]}>
              {[...Array(10)].map((_, i) => (
                <Box
                  key={i}
                  args={[0.15, 0.4, 0.3]}
                  position={[(i - 4.5) * 0.2, 0, 0]}
                  rotation={[0.4, 0, 0]}
                >
                  <meshStandardMaterial color="#4b5563" />
                </Box>
              ))}
            </group>
            {/* Sliding Doors */}
            <SafetyDoor width={0.9} height={0.8} position={[-0.5, 0.9, 0.71]} />
            <SafetyDoor width={0.9} height={0.8} position={[0.5, 0.9, 0.71]} />
            {/* Monitor */}
            <MonitorArm position={[1.0, 1.2, 0.7]} rotation={[0, -0.5, 0]} />
          </group>
        )
      case 'Reflow Oven':
        return (
          <group>
            {/* Long Body */}
            <Box args={[3.2, 1.2, 1.2]} position={[0, 0.6, 0]}>
              <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.6} />
            </Box>
            {/* Hood/Lid */}
            <Box args={[3.0, 0.4, 1.0]} position={[0, 1.4, 0]}>
              <meshStandardMaterial color="#d1d5db" />
            </Box>
            {/* Exhaust Pipes */}
            <Cylinder args={[0.15, 0.15, 0.8]} position={[-1.0, 1.8, 0]}>
              <meshStandardMaterial color="#6b7280" />
            </Cylinder>
            <Cylinder args={[0.15, 0.15, 0.8]} position={[1.0, 1.8, 0]}>
              <meshStandardMaterial color="#6b7280" />
            </Cylinder>
            {/* Emergency Stop Button */}
            <Box args={[0.1, 0.1, 0.05]} position={[1.5, 1.0, 0.6]}>
              <meshStandardMaterial color="#ef4444" />
            </Box>
          </group>
        )
      case 'AOI':
      case 'SPI':
        return (
          <group>
            {/* Compact Body */}
            <Box args={[1.0, 1.3, 1.0]} position={[0, 0.65, 0]}>
              <meshStandardMaterial color="#e5e7eb" />
            </Box>
            {/* Dark Glass Front */}
            <Box args={[0.8, 0.5, 0.05]} position={[0, 0.9, 0.5]}>
              <meshPhysicalMaterial color="#111827" roughness={0} metalness={0.8} />
            </Box>
            {/* Monitor */}
            <MonitorArm position={[0.4, 1.2, 0.5]} rotation={[0, -0.2, 0]} />
          </group>
        )
      default:
        return (
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#9ca3af" />
          </Box>
        )
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: React Three Fiber 使用 group 作为可交互 3D 节点容器。
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
        onSelectConnection?.(connection)
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderMachineGeometry()}

      {/* Signal Tower on every machine */}
      <SignalTower status={station.status} position={[0.4, 1.8, -0.4]} />

      {/* Kernel integration marker */}
      <mesh position={[-0.45, 1.85, -0.42]}>
        <sphereGeometry args={[0.1, 18, 18]} />
        <meshStandardMaterial
          color={INTEGRATION_COLORS[connection.integration_status]}
          emissive={INTEGRATION_COLORS[connection.integration_status]}
          emissiveIntensity={1.5}
        />
      </mesh>

      {hovered && (
        <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/90 text-white p-3 rounded-lg shadow-xl border border-slate-700 backdrop-blur-sm text-xs min-w-[150px]">
            <div className="font-bold text-sm mb-1 text-blue-400">{station.name}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-slate-400">状态:</span>
              <span style={{ color: STATUS_COLORS[station.status] }} className="font-mono">
                {getStatusLabel(station.status)}
              </span>
              <span className="text-slate-400">节拍:</span>
              <span className="font-mono">{station.cycleTime.toFixed(1)}s</span>
              <span className="text-slate-400">类型:</span>
              <span>{getMachineTypeLabel(station.type)}</span>
              <span className="text-slate-400">接入:</span>
              <span
                className={
                  connection.integration_status === 'connected'
                    ? 'text-green-400'
                    : connection.integration_status === 'abnormal'
                      ? 'text-red-400'
                      : 'text-slate-300'
                }
              >
                {getIntegrationLabel(connection.integration_status)}
              </span>
              <span className="text-slate-400">协议:</span>
              <span>{connection.protocol || '未绑定'}</span>
              <span className="text-slate-400">通信:</span>
              <span>{formatLastCommunication(connection.last_communication_at)}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
