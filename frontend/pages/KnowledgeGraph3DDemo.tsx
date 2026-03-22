import {
  Billboard,
  ContactShadows,
  Environment,
  Float,
  Html,
  Line,
  OrbitControls,
  Sphere,
} from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Box, GitBranch, Lightbulb } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { getAllKnowledgeGraphsMerged } from '../mockData'
import type { KnowledgeGraph, KnowledgeNode } from '../types'

type DemoNode = Omit<KnowledgeNode, 'label'> & {
  label: string
  rawLabel: string
  position: [number, number, number]
}

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 9, 24)
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0)

const getNodeColor = (type: KnowledgeNode['type']) => {
  switch (type) {
    case 'phenomenon':
      return '#ef4444'
    case 'cause':
      return '#f97316'
    case 'solution':
      return '#10b981'
  }
}

const getNodeLabel = (type: KnowledgeNode['type']) => {
  switch (type) {
    case 'phenomenon':
      return '异常现象'
    case 'cause':
      return '原因节点'
    case 'solution':
      return '解决方案'
  }
}

const getNodeIcon = (type: KnowledgeNode['type']) => {
  switch (type) {
    case 'phenomenon':
      return GitBranch
    case 'cause':
      return Box
    case 'solution':
      return Lightbulb
  }
}

const getNodeRadius = (type: KnowledgeNode['type']) => {
  switch (type) {
    case 'phenomenon':
      return 0.78
    case 'cause':
      return 0.66
    case 'solution':
      return 0.58
  }
}

const getDisplayLabel = (label: string) => {
  const separatorIndex = label.indexOf(': ')
  if (separatorIndex > 0) {
    return label.slice(separatorIndex + 2)
  }
  return label
}

const buildLayeredGraph = (graph: KnowledgeGraph): DemoNode[] => {
  const nodesByType: Record<KnowledgeNode['type'], KnowledgeNode[]> = {
    phenomenon: [],
    cause: [],
    solution: [],
  }

  graph.nodes.forEach((node) => {
    nodesByType[node.type].push(node)
  })

  const shellConfig: Record<
    KnowledgeNode['type'],
    { radius: number; verticalRange: number; swirlOffset: number }
  > = {
    phenomenon: { radius: 5.6, verticalRange: 3.4, swirlOffset: 0.2 },
    cause: { radius: 8.8, verticalRange: 4.6, swirlOffset: 1.4 },
    solution: { radius: 12.2, verticalRange: 5.8, swirlOffset: 2.6 },
  }

  return (Object.keys(nodesByType) as KnowledgeNode['type'][]).flatMap((type) => {
    const items = nodesByType[type]
    const { radius, verticalRange, swirlOffset } = shellConfig[type]

    return items.map((node, index) => {
      const normalizedIndex = (index + 0.5) / Math.max(items.length, 1)
      const phi = Math.acos(1 - 2 * normalizedIndex)
      const theta = Math.PI * (3 - Math.sqrt(5)) * index + swirlOffset
      const wave = Math.sin(index * 1.7 + swirlOffset) * 0.9
      const radialOffset = Math.cos(index * 1.13 + swirlOffset) * 0.75
      const shellRadius = radius + radialOffset
      const x = Math.cos(theta) * Math.sin(phi) * shellRadius
      const z = Math.sin(theta) * Math.sin(phi) * shellRadius
      const y = Math.cos(phi) * verticalRange + wave

      return {
        ...node,
        rawLabel: node.label,
        label: getDisplayLabel(node.label),
        position: [x, y, z] as [number, number, number],
      }
    })
  })
}

const GraphNodeMesh: React.FC<{
  node: DemoNode
  active: boolean
  hovered: boolean
  onSelect: (node: DemoNode) => void
  onHover: (nodeId: string | null) => void
}> = ({ node, active, hovered, onSelect, onHover }) => {
  const color = getNodeColor(node.type)
  const radius = getNodeRadius(node.type)
  const emphasized = active || hovered

  return (
    <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.35}>
      <group position={node.position}>
        <Sphere args={[radius * 1.28, 32, 32]}>
          <meshBasicMaterial color={color} transparent opacity={emphasized ? 0.18 : 0.08} />
        </Sphere>
        <Sphere
          args={[radius, 48, 48]}
          onClick={() => onSelect(node)}
          onPointerOver={() => onHover(node.id)}
          onPointerOut={() => onHover(null)}
        >
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? 0.95 : hovered ? 0.72 : 0.42}
            transparent
            opacity={active ? 0.76 : hovered ? 0.62 : 0.48}
            roughness={0.08}
            metalness={0.05}
            transmission={0.08}
            thickness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.12}
          />
        </Sphere>
        <Sphere
          args={[radius * 0.46, 24, 24]}
          position={[-radius * 0.24, radius * 0.2, radius * 0.3]}
        >
          <meshBasicMaterial color="#ffffff" transparent opacity={emphasized ? 0.22 : 0.1} />
        </Sphere>
        {emphasized && (
          <Billboard
            follow
            lockX={false}
            lockY={false}
            lockZ={false}
            position={[0, radius + 0.88, 0]}
          >
            <Html center transform sprite distanceFactor={18}>
              <div
                className={`whitespace-nowrap text-center text-[10px] font-medium tracking-[0.04em] ${
                  active ? 'text-white/88' : 'text-white/62'
                }`}
              >
                {node.label}
              </div>
            </Html>
          </Billboard>
        )}
      </group>
    </Float>
  )
}

const CameraFocusAnimator: React.FC<{
  controlsRef: React.RefObject<{
    target: THREE.Vector3
    update: () => void
  } | null>
  focusPosition?: [number, number, number]
}> = ({ controlsRef, focusPosition }) => {
  const { camera } = useThree()
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const controls = controlsRef.current
    const startPosition = camera.position.clone()
    const startTarget = controls ? controls.target.clone() : DEFAULT_CAMERA_TARGET.clone()
    const targetPosition = DEFAULT_CAMERA_POSITION.clone()
    const targetLookAt = DEFAULT_CAMERA_TARGET.clone()
    const offsetVector = new THREE.Vector3()

    if (focusPosition) {
      targetLookAt.set(focusPosition[0], focusPosition[1], focusPosition[2])
      offsetVector
        .set(focusPosition[0], focusPosition[1] * 0.4, focusPosition[2])
        .normalize()
        .multiplyScalar(6.4)

      if (offsetVector.lengthSq() === 0) {
        offsetVector.set(0, 2.4, 6.4)
      } else {
        offsetVector.y += 1.8
      }
      targetPosition.copy(targetLookAt).add(offsetVector)
    }

    const startTime = performance.now()
    const duration = 520
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = easeOutCubic(progress)

      camera.position.lerpVectors(startPosition, targetPosition, eased)

      if (controls) {
        controls.target.lerpVectors(startTarget, targetLookAt, eased)
        controls.update()
      } else {
        camera.lookAt(targetLookAt)
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step)
      } else {
        animationFrameRef.current = null
      }
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [camera, controlsRef, focusPosition])

  return null
}

const GraphScene: React.FC<{
  graph: KnowledgeGraph
  selectedNodeId?: string
  selectedNodePosition?: [number, number, number]
  focusKey: number
  hoveredNodeId?: string
  onSelect: (node: DemoNode) => void
  onHover: (nodeId: string | null) => void
}> = ({
  graph,
  selectedNodeId,
  selectedNodePosition,
  focusKey,
  hoveredNodeId,
  onSelect,
  onHover,
}) => {
  const nodes = useMemo(() => buildLayeredGraph(graph), [graph])
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const controlsRef = useRef<{
    target: THREE.Vector3
    update: () => void
  } | null>(null)

  return (
    <>
      <color attach="background" args={['#09111f']} />
      <fog attach="fog" args={['#09111f', 14, 28]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 10, 6]} intensity={1.2} color="#f8fbff" />
      <pointLight position={[-8, 4, -6]} intensity={1.4} color="#38bdf8" />
      <pointLight position={[6, 2, 8]} intensity={1.1} color="#34d399" />

      <Environment preset="city" />

      <group position={[0, -3.4, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[14, 64]} />
          <meshStandardMaterial color="#0f172a" roughness={0.88} metalness={0.08} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[3.2, 13.6, 64]} />
          <meshBasicMaterial color="#1d4ed8" transparent opacity={0.12} />
        </mesh>
      </group>

      {graph.edges.map((edge) => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id
        const source = nodeMap.get(sourceId)
        const target = nodeMap.get(targetId)
        if (!source || !target) return null

        return (
          <Line
            key={edge.id}
            points={[source.position, target.position]}
            color="#60a5fa"
            transparent
            opacity={0.42}
            lineWidth={1.2}
          />
        )
      })}

      {nodes.map((node) => (
        <GraphNodeMesh
          key={node.id}
          node={node}
          active={selectedNodeId === node.id}
          hovered={hoveredNodeId === node.id}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      <ContactShadows position={[0, -3.35, 0]} opacity={0.28} scale={30} blur={1.8} far={10} />
      <CameraFocusAnimator
        key={focusKey}
        controlsRef={controlsRef}
        focusPosition={selectedNodePosition}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={14}
        maxDistance={42}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enablePan
      />
    </>
  )
}

const KnowledgeGraph3DDemo: React.FC = () => {
  const graph = useMemo(() => getAllKnowledgeGraphsMerged(), [])
  const [selectedNode, setSelectedNode] = useState<DemoNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)

  if (!graph) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        3D demo 数据缺失
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top,#102242_0%,#09111f_48%,#050814_100%)] text-white">
      <div className="w-[22rem] shrink-0 border-r border-white/10 bg-slate-950/55 p-5 backdrop-blur-xl">
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
            Knowledge Graph
          </p>
          <h1 className="mt-2 text-2xl font-semibold">知识图谱</h1>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: '节点', value: graph.nodes.length },
            { label: '关系', value: graph.edges.length },
            { label: '层级', value: new Set(graph.nodes.map((item) => item.type)).size },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <p className="text-[11px] text-slate-400">{item.label}</p>
              <p className="mt-2 text-xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">节点详情</p>
          {selectedNode ? (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getNodeIcon(selectedNode.type)
                  return <Icon size={16} className="text-cyan-300" />
                })()}
                <span className="text-sm font-medium text-cyan-100">
                  {getNodeLabel(selectedNode.type)}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold">{selectedNode.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                {selectedNode.rawLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedNode.description}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              默认先展示全貌，悬停节点会临时显示名称，点击后镜头聚焦并在这里查看详情。
            </p>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <div className="absolute left-6 top-6 z-10 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs text-slate-200 backdrop-blur">
          鼠标左键自由旋转，滚轮缩放，右键平移
        </div>
        <div className="absolute left-6 top-20 z-10 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-xs text-slate-300 backdrop-blur">
          悬停节点显示名称，点击节点聚焦查看
        </div>

        <Canvas camera={{ position: [0, 9, 24], fov: 40 }} dpr={[1, 1.75]}>
          <GraphScene
            graph={graph}
            selectedNodeId={selectedNode?.id}
            selectedNodePosition={selectedNode?.position}
            focusKey={focusKey}
            hoveredNodeId={hoveredNodeId || undefined}
            onSelect={(node) => {
              setSelectedNode(node)
              setFocusKey((value) => value + 1)
            }}
            onHover={setHoveredNodeId}
          />
        </Canvas>
      </div>
    </div>
  )
}

export default KnowledgeGraph3DDemo
