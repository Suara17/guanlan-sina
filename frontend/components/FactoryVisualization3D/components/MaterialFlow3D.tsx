import { useFrame } from '@react-three/fiber'
import type React from 'react'
import { useMemo, useRef } from 'react'
import type { InstancedMesh } from 'three'
import * as THREE from 'three'

interface MaterialFlowProps {
  length: number
  count?: number
  speed?: number
  position?: [number, number, number]
}

export const MaterialFlow3D: React.FC<MaterialFlowProps> = ({
  length,
  count = 5,
  speed = 2,
  position = [0, 0, 0],
}) => {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Store initial random offsets for each particle
  const offsets = useMemo(() => {
    return new Float32Array(count).map(() => Math.random() * length)
  }, [count, length])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.getElapsedTime()

    for (let i = 0; i < count; i++) {
      // Calculate position based on time and offset
      // Loop the position from 0 to length
      const x = (time * speed + offsets[i]) % length

      // Position relative to the start of the line
      // The conveyor starts at 0 and goes to length along X
      // But the conveyor is centered? No, in ProductionLine3D it starts at 0.

      dummy.position.set(x, 0.3, 0) // Slightly above conveyor
      dummy.scale.set(0.3, 0.1, 0.3) // Flat box
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.5} />
    </instancedMesh>
  )
}
