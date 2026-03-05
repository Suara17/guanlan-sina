import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import type React from 'react'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { StationConnectionDetails } from './factoryData'
import { FactoryBuilding3D } from './components/FactoryBuilding3D'
import { Floor3D } from './components/Floor3D'
import { Workshop3D } from './components/Workshop3D'
import { useFactoryStore } from './store'

interface FactorySceneProps {
  resolveStationConnection?: (lineName: string, stationName: string) => StationConnectionDetails
  onSelectStationConnection?: (details: StationConnectionDetails) => void
}

const CameraController = () => {
  const { level, selectedFactory, selectedWorkshop, selectedLine, cameraResetToken } =
    useFactoryStore()
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  useEffect(() => {
    void cameraResetToken
    const targetPos = new THREE.Vector3(0, 60, 60)
    const targetLookAt = new THREE.Vector3(0, 0, 0)

    if (level === 'global') {
      targetPos.set(0, 60, 80)
      targetLookAt.set(0, 0, 0)
    } else if (level === 'factory' && selectedFactory) {
      targetPos.set(0, 40, 40)
      targetLookAt.set(0, 0, 0)
    } else if (level === 'workshop' && selectedWorkshop) {
      const workshopX = selectedWorkshop.gridPos.x
      targetPos.set(workshopX + 15, 25, 25)
      targetLookAt.set(workshopX + 10, 0, 5)
    } else if (level === 'line' && selectedLine && selectedWorkshop) {
      const workshopX = selectedWorkshop.gridPos.x
      const lineIndex = selectedWorkshop.lines.findIndex((line) => line.id === selectedLine.id)
      const lineZ = lineIndex * 8

      targetPos.set(workshopX + 10, 8, lineZ + 15)
      targetLookAt.set(workshopX + 10, 0, lineZ)
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
    })

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: () => controlsRef.current?.update(),
      })
    }
  }, [level, selectedFactory, selectedWorkshop, selectedLine, cameraResetToken, camera])

  return <OrbitControls ref={controlsRef} makeDefault maxPolarAngle={Math.PI / 2.1} />
}

export const FactoryScene: React.FC<FactorySceneProps> = ({
  resolveStationConnection,
  onSelectStationConnection,
}) => {
  const { data, level, selectedFactory, drillDownToWorkshop } = useFactoryStore()

  return (
    <div className="w-full h-full bg-slate-50">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 60, 80], fov: 50 }}>
        <CameraController />

        <ambientLight intensity={0.8} />
        <directionalLight
          position={[50, 80, 40]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
        </directionalLight>

        <Environment preset="city" />
        <fog attach="fog" args={['#f8fafc', 30, 200]} />
        <gridHelper args={[300, 60, '#cbd5e1', '#f1f5f9']} position={[0, 0.01, 0]} />

        <group>
          {level === 'global' &&
            data.map((factory) => <FactoryBuilding3D key={factory.id} factory={factory} />)}

          {level !== 'global' &&
            selectedFactory &&
            selectedFactory.workshops.map((workshop) => (
              <Workshop3D
                key={workshop.id}
                workshop={workshop}
                position={[workshop.gridPos.x, 0, workshop.gridPos.y]}
                onClick={() => drillDownToWorkshop(workshop)}
                resolveStationConnection={resolveStationConnection}
                onSelectStationConnection={onSelectStationConnection}
              />
            ))}

          <Floor3D width={300} depth={300} />
        </group>

        <ContactShadows
          resolution={1024}
          scale={300}
          blur={2.5}
          opacity={0.4}
          far={10}
          color="#94a3b8"
        />
      </Canvas>
    </div>
  )
}
