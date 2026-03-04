/* biome-ignore-all lint/suspicious/noArrayIndexKey: 车间装饰结构为固定渲染序列，索引键不会影响业务状态。 */
import { Box, Html, Text } from '@react-three/drei'
import type React from 'react'
import type { Workshop } from '../factoryData'
import { useFactoryStore } from '../store'
import { ProductionLine3D } from './ProductionLine3D'

interface Workshop3DProps {
  workshop: Workshop
  position?: [number, number, number]
  onClick?: () => void
}

const getStatusLabel = (status: 'running' | 'idle' | 'error'): string => {
  if (status === 'running') return '运行中'
  if (status === 'idle') return '待机'
  return '故障'
}

// --- Industrial Props ---

// Industrial Storage Rack
const StorageRack = ({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) => (
  <group position={position} rotation={rotation}>
    {/* Frame */}
    <Box args={[0.1, 3, 0.1]} position={[-1.5, 1.5, -0.5]}>
      <meshStandardMaterial color="#1e3a8a" />
    </Box>
    <Box args={[0.1, 3, 0.1]} position={[1.5, 1.5, -0.5]}>
      <meshStandardMaterial color="#1e3a8a" />
    </Box>
    <Box args={[0.1, 3, 0.1]} position={[-1.5, 1.5, 0.5]}>
      <meshStandardMaterial color="#1e3a8a" />
    </Box>
    <Box args={[0.1, 3, 0.1]} position={[1.5, 1.5, 0.5]}>
      <meshStandardMaterial color="#1e3a8a" />
    </Box>

    {/* Shelves */}
    {[0.5, 1.5, 2.5].map((y, i) => (
      <Box key={i} args={[3.2, 0.05, 1.2]} position={[0, y, 0]}>
        <meshStandardMaterial color="#fbbf24" /> {/* Orange/Yellow beams */}
      </Box>
    ))}

    {/* Boxes on shelves */}
    <Box args={[0.8, 0.6, 0.8]} position={[-0.8, 0.8, 0]}>
      <meshStandardMaterial color="#d97706" />
    </Box>
    <Box args={[0.8, 0.6, 0.8]} position={[0.2, 0.8, 0]}>
      <meshStandardMaterial color="#b45309" />
    </Box>
    <Box args={[0.8, 0.5, 0.8]} position={[0.5, 1.8, 0.2]}>
      <meshStandardMaterial color="#d97706" />
    </Box>
  </group>
)

// Wooden Pallet Stack
const PalletStack = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    {[...Array(3)].map((_, i) => (
      <group key={i} position={[0, i * 0.2, 0]} rotation={[0, i * 0.1, 0]}>
        <Box args={[1.2, 0.15, 1.2]} position={[0, 0.075, 0]}>
          <meshStandardMaterial color="#d4a373" />
        </Box>
      </group>
    ))}
  </group>
)

// Structural Pillar
const Pillar = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <Box args={[0.8, 8, 0.8]} position={[0, 4, 0]}>
      <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.3} />
    </Box>
    {/* Base Protection */}
    <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
      <meshStandardMaterial color="#facc15" /> {/* Yellow safety color */}
    </Box>
    <Box args={[1.05, 0.2, 1.05]} position={[0, 0.2, 0]}>
      <meshStandardMaterial color="#000000" /> {/* Black stripe */}
    </Box>
    <Box args={[1.05, 0.2, 1.05]} position={[0, 0.8, 0]}>
      <meshStandardMaterial color="#000000" /> {/* Black stripe */}
    </Box>
  </group>
)

// Safety Floor Marking
const SafetyZone = ({
  width,
  depth,
  position,
}: {
  width: number
  depth: number
  position: [number, number, number]
}) => (
  <group position={position}>
    {/* Yellow Outline */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color="#facc15" />
    </mesh>
    {/* Inner Floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={[width - 0.2, depth - 0.2]} />
      <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
    </mesh>
  </group>
)

export const Workshop3D: React.FC<Workshop3DProps> = ({
  workshop,
  position = [0, 0, 0],
  onClick,
}) => {
  const LINE_SPACING = 8 // Increased spacing for better visibility
  const { drillDownToLine, level } = useFactoryStore()

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: React Three Fiber 使用 group 作为可交互 3D 节点容器。
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {/* Workshop Floor Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.01, LINE_SPACING]} receiveShadow>
        <planeGeometry args={[40, 35]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Structural Pillars */}
      <Pillar position={[-5, 0, -5]} />
      <Pillar position={[-5, 0, 20]} />
      <Pillar position={[25, 0, -5]} />
      <Pillar position={[25, 0, 20]} />

      {/* Racks & Storage (Industrial Clutter) */}
      <StorageRack position={[-5, 0, 5]} rotation={[0, Math.PI / 2, 0]} />
      <StorageRack position={[-5, 0, 10]} rotation={[0, Math.PI / 2, 0]} />
      <PalletStack position={[22, 0, 5]} />
      <PalletStack position={[23, 0, 8]} />

      {/* Workshop Label */}
      <Text
        position={[10, 0.1, -8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.5}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {workshop.name}
      </Text>

      {/* Production Lines */}
      {workshop.lines.map((line, index) => (
        <group key={line.id} position={[0, 0, index * LINE_SPACING]}>
          {/* Safety Zone Marking for Line */}
          <SafetyZone width={22} depth={5} position={[10, 0, 0]} />

          <ProductionLine3D
            line={line}
            position={[0, 0, 0]}
            onClick={() => drillDownToLine(line)}
          />
        </group>
      ))}

      {level === 'factory' && (
        <Html position={[10, 5, 6]} center distanceFactor={25} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/90 text-white px-4 py-2 rounded-lg shadow-xl border border-slate-700 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform min-w-[150px]">
            <h3 className="font-bold text-lg">{workshop.name}</h3>
            <div className="flex items-center gap-2 mt-1 justify-between">
              <span className="text-xs text-slate-400 font-mono uppercase">状态</span>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    workshop.status === 'running'
                      ? 'bg-green-500'
                      : workshop.status === 'idle'
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                  }`}
                ></div>
                <span
                  className={`text-xs font-bold ${
                    workshop.status === 'running'
                      ? 'text-green-400'
                      : workshop.status === 'idle'
                        ? 'text-yellow-300'
                        : 'text-red-400'
                  }`}
                >
                  {getStatusLabel(workshop.status)}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
