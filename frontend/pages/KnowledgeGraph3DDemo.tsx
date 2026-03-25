import {
  Billboard,
  ContactShadows,
  Environment,
  Float,
  Html,
  Line,
  OrbitControls,
  Sphere,
  Text,
} from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Box, ChevronDown, GitBranch, Lightbulb } from 'lucide-react'
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

const getEdgeLabel = (type: KnowledgeGraph['edges'][number]['type']) => {
  switch (type) {
    case 'leads_to':
      return '导致'
    case 'caused_by':
      return '源于'
    case 'solved_by':
      return '解决'
  }
}

const getEdgeColor = (type: KnowledgeGraph['edges'][number]['type']) => {
  switch (type) {
    case 'leads_to':
      return '#fb7185'
    case 'caused_by':
      return '#f59e0b'
    case 'solved_by':
      return '#34d399'
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

const NODE_GROUP_ORDER: KnowledgeNode['type'][] = ['phenomenon', 'cause', 'solution']

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

const GraphEdge3D: React.FC<{
  edge: KnowledgeGraph['edges'][number]
  source: DemoNode
  target: DemoNode
  emphasized: boolean
  dimmed: boolean
}> = ({ edge, source, target, emphasized, dimmed }) => {
  const color = getEdgeColor(edge.type)
  const relationLabel = edge.label || getEdgeLabel(edge.type)
  const arrowLength = 0.48

  const geometry = useMemo(() => {
    const sourceVector = new THREE.Vector3(...source.position)
    const targetVector = new THREE.Vector3(...target.position)
    const direction = targetVector.clone().sub(sourceVector)
    const unitDirection = direction.clone().normalize()
    const start = sourceVector
      .clone()
      .add(unitDirection.clone().multiplyScalar(getNodeRadius(source.type) * 1.15))
    const end = targetVector
      .clone()
      .add(unitDirection.clone().multiplyScalar(-getNodeRadius(target.type) * 1.45))
    const visibleDirection = end.clone().sub(start)
    const visibleLength = Math.max(visibleDirection.length(), 0.001)
    const visibleUnitDirection = visibleDirection.clone().normalize()
    const midpoint = start.clone().lerp(end, 0.5)
    const arrowPosition = end.clone().add(visibleUnitDirection.clone().multiplyScalar(-arrowLength / 2))
    const arrowQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      visibleUnitDirection
    )

    return {
      points: [
        start.toArray() as [number, number, number],
        end.toArray() as [number, number, number],
      ],
      midpoint: midpoint.toArray() as [number, number, number],
      arrowPosition: arrowPosition.toArray() as [number, number, number],
      arrowQuaternion,
      visibleLength,
    }
  }, [arrowLength, source.position, source.type, target.position, target.type])

  return (
    <group>
      <Line
        points={geometry.points}
        color={color}
        transparent
        opacity={dimmed ? 0.14 : emphasized ? 0.96 : 0.48}
        lineWidth={emphasized ? 2.8 : 1.45}
      />
      <mesh
        position={geometry.arrowPosition}
        quaternion={geometry.arrowQuaternion}
        scale={emphasized ? 1.12 : 1}
      >
        <coneGeometry args={[0.16, arrowLength, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emphasized ? 1.05 : 0.5}
          transparent
          opacity={dimmed ? 0.2 : emphasized ? 0.98 : 0.72}
          roughness={0.24}
          metalness={0.08}
        />
      </mesh>
      <Billboard follow position={geometry.midpoint}>
        <group visible={geometry.visibleLength >= 2.2}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.1, 0.36]} />
            <meshBasicMaterial
              color={emphasized ? '#020617' : '#0f172a'}
              transparent
              opacity={dimmed ? 0.14 : emphasized ? 0.86 : 0.58}
              depthWrite={false}
            />
          </mesh>
          <Text
            fontSize={emphasized ? 0.22 : 0.2}
            color={emphasized ? '#dbeafe' : '#e2e8f0'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#020617"
            fillOpacity={dimmed ? 0.2 : 0.96}
            material-depthWrite={false}
          >
            {relationLabel}
          </Text>
        </group>
      </Billboard>
    </group>
  )
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
  const emphasizedEdgeIds = useMemo(() => {
    if (!selectedNodeId && !hoveredNodeId) return new Set<string>()

    const activeNodeIds = new Set<string>()
    if (selectedNodeId) activeNodeIds.add(selectedNodeId)
    if (hoveredNodeId) activeNodeIds.add(hoveredNodeId)

    return new Set(
      graph.edges
        .filter((edge) => {
          const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id
          const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id
          return activeNodeIds.has(sourceId) || activeNodeIds.has(targetId)
        })
        .map((edge) => edge.id)
    )
  }, [graph.edges, hoveredNodeId, selectedNodeId])
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
          <GraphEdge3D
            key={edge.id}
            edge={edge}
            source={source}
            target={target}
            emphasized={emphasizedEdgeIds.has(edge.id)}
            dimmed={emphasizedEdgeIds.size > 0 && !emphasizedEdgeIds.has(edge.id)}
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
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const navigationNodes = useMemo(() => {
    return buildLayeredGraph(graph).sort((a, b) => {
      if (a.type !== b.type) {
        return getNodeLabel(a.type).localeCompare(getNodeLabel(b.type), 'zh-CN')
      }
      return a.label.localeCompare(b.label, 'zh-CN')
    })
  }, [graph])
  const [selectedNode, setSelectedNode] = useState<DemoNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)
  const [nodeQuery, setNodeQuery] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [collapsedGroups, setCollapsedGroups] = useState<Record<KnowledgeNode['type'], boolean>>({
    phenomenon: false,
    cause: false,
    solution: false,
  })

  const handleSelectNode = (node: DemoNode) => {
    setSelectedNode(node)
    setFocusKey((value) => value + 1)
  }

  const filteredNavigationNodes = useMemo(() => {
    const normalizedQuery = nodeQuery.trim().toLowerCase()
    if (!normalizedQuery) return navigationNodes

    return navigationNodes.filter((node) => {
      return (
        node.label.toLowerCase().includes(normalizedQuery) ||
        node.rawLabel.toLowerCase().includes(normalizedQuery) ||
        node.description.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [navigationNodes, nodeQuery])

  const groupedNavigationNodes = useMemo(() => {
    const groups: Record<KnowledgeNode['type'], DemoNode[]> = {
      phenomenon: [],
      cause: [],
      solution: [],
    }

    filteredNavigationNodes.forEach((node) => {
      groups[node.type].push(node)
    })

    return groups
  }, [filteredNavigationNodes])

  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      setCanvasSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
    }

    const observer = new ResizeObserver(() => {
      updateCanvasSize()
    })

    observer.observe(container)
    updateCanvasSize()
    const rafId = window.requestAnimationFrame(updateCanvasSize)
    const timerId = window.setTimeout(updateCanvasSize, 120)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timerId)
    }
  }, [])

  if (!graph) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        3D demo 数据缺失
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#102242_0%,#09111f_48%,#050814_100%)] text-white">
      <div className="flex h-full w-[22rem] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-slate-950/55 p-5 backdrop-blur-xl">
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

        <div className="mt-6 shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
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

        <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">节点导航</p>
            <span className="text-[11px] text-slate-500">
              {filteredNavigationNodes.length} 个结果
            </span>
          </div>
          <input
            type="text"
            value={nodeQuery}
            onChange={(event) => setNodeQuery(event.target.value)}
            placeholder="搜索异常、原因、方案"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
          />
          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {NODE_GROUP_ORDER.map((groupType) => {
              const groupNodes = groupedNavigationNodes[groupType]
              const isCollapsed = collapsedGroups[groupType]
              const groupLabel = getNodeLabel(groupType)

              if (groupNodes.length === 0) {
                return null
              }

              return (
                <div
                  key={groupType}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/28"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((current) => ({
                        ...current,
                        [groupType]: !current[groupType],
                      }))
                    }
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{groupLabel}</p>
                      <p className="text-[11px] text-slate-500">{groupNodes.length} 个节点</p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 border-t border-white/10 px-2 pb-2 pt-2">
                      {groupNodes.map((node) => {
                        const isSelected = selectedNode?.id === node.id
                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => handleSelectNode(node)}
                            className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                              isSelected
                                ? 'border-cyan-300/60 bg-cyan-400/12'
                                : 'border-white/10 bg-slate-950/35 hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium text-slate-100">
                                {node.label}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                              {node.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {filteredNavigationNodes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-center text-sm text-slate-500">
                没搜到匹配节点，换个关键词试试
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={canvasContainerRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute left-6 top-6 z-10 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs text-slate-200 backdrop-blur">
          鼠标左键自由旋转，滚轮缩放，右键平移
        </div>
        <div className="absolute left-6 top-20 z-10 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-xs text-slate-300 backdrop-blur">
          悬停节点显示名称，点击节点聚焦查看
        </div>

        {canvasSize.width > 0 && canvasSize.height > 0 ? (
          <Canvas
            key={`${canvasSize.width}x${canvasSize.height}`}
            camera={{ position: [0, 9, 24], fov: 40 }}
            dpr={[1, 1.75]}
            className="h-full w-full"
          >
            <GraphScene
              graph={graph}
              selectedNodeId={selectedNode?.id}
              selectedNodePosition={selectedNode?.position}
              focusKey={focusKey}
              hoveredNodeId={hoveredNodeId || undefined}
              onSelect={handleSelectNode}
              onHover={setHoveredNodeId}
            />
          </Canvas>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#09111f] text-sm text-slate-400">
            正在初始化 3D 图谱...
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeGraph3DDemo
