import { Html } from '@react-three/drei'
import type React from 'react'
import type { WorkshopLine } from '../factoryData'
import { useFactoryStore } from '../store'
import { Conveyor3D } from './Conveyor3D'
import { MaterialFlow3D } from './MaterialFlow3D'
import { Station3D } from './Station3D'

interface ProductionLine3DProps {
  line: WorkshopLine
  position?: [number, number, number]
  onClick?: () => void
}

export const ProductionLine3D: React.FC<ProductionLine3DProps> = ({
  line,
  position = [0, 0, 0],
  onClick,
}) => {
  const STATION_SPACING = 2.5
  const TOTAL_LENGTH = line.stations.length * STATION_SPACING
  const { level } = useFactoryStore()

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: React Three Fiber 使用 group 作为可交互 3D 节点容器。
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {/* Conveyor Belt running through the line */}
      <Conveyor3D length={TOTAL_LENGTH} position={[TOTAL_LENGTH / 2 - STATION_SPACING / 2, 0, 0]} />

      {/* Material Flow Animation - Only visible when running */}
      {line.status === 'running' && (
        <MaterialFlow3D
          length={TOTAL_LENGTH}
          count={8}
          speed={1.5}
          position={[-STATION_SPACING / 2, 0, 0]}
        />
      )}

      {/* Stations */}
      {line.stations.map((station, index) => (
        <Station3D key={station.id} station={station} position={[index * STATION_SPACING, 0, 0]} />
      ))}

      {/* Line Label (only visible at workshop level or higher) */}
      {level !== 'line' && (
        <Html position={[TOTAL_LENGTH / 2, 2.5, 0]} center distanceFactor={15}>
          <div className="bg-slate-800/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-slate-600 shadow-lg cursor-pointer hover:bg-slate-700 transition-colors">
            {line.name}
          </div>
        </Html>
      )}
    </group>
  )
}
