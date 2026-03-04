import { Plane } from '@react-three/drei'
import type React from 'react'

interface FloorProps {
  width?: number
  depth?: number
}

export const Floor3D: React.FC<FloorProps> = ({ width = 100, depth = 100 }) => {
  return (
    <Plane
      args={[width, depth]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <meshStandardMaterial color="#f8fafc" roughness={1} metalness={0} />
    </Plane>
  )
}
