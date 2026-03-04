import { Box } from '@react-three/drei'
import type React from 'react'

interface ConveyorProps {
  length: number
  width?: number
  height?: number
  position?: [number, number, number]
}

export const Conveyor3D: React.FC<ConveyorProps> = ({
  length,
  width = 1,
  height = 0.2,
  position = [0, 0, 0],
}) => {
  return (
    <group position={position}>
      {/* Belt */}
      <Box args={[length, height, width]} position={[0, height / 2, 0]}>
        <meshStandardMaterial color="#374151" roughness={0.8} />
      </Box>

      {/* Legs */}
      <Box args={[0.1, 0.5, width]} position={[-length / 2 + 0.2, -0.25, 0]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>
      <Box args={[0.1, 0.5, width]} position={[length / 2 - 0.2, -0.25, 0]}>
        <meshStandardMaterial color="#1f2937" />
      </Box>
    </group>
  )
}
