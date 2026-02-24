import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Calculator,
  Camera,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Combine,
  Cpu,
  Database,
  FileJson,
  Filter,
  Gauge,
  GitBranch,
  Globe2,
  HardDrive,
  Mail,
  Microscope,
  Network,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Target,
  Trash2,
  Truck,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useRef, useState } from 'react'

// 组件库项类型定义
type ComponentItem = {
  id: string
  label: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ForwardRefExoticComponent<any>
  iconName: string
  color: string
  featured?: boolean
}

// 组件库数据定义
const componentLibrary: {
  dataSources: ComponentItem[]
  atomicCapabilities: ComponentItem[]
  dataProcessing: ComponentItem[]
  actions: ComponentItem[]
} = {
  dataSources: [
    {
      id: 'camera',
      label: '工业相机',
      description: '实时图像采集',
      icon: Camera,
      iconName: 'Camera',
      color: 'slate',
    },
    {
      id: 'plc',
      label: 'PLC 信号',
      description: '设备状态/触发信号',
      icon: Cpu,
      iconName: 'Cpu',
      color: 'slate',
    },
    {
      id: 'mqtt',
      label: 'MQTT 订阅',
      description: '消息队列数据接入',
      icon: Radio,
      iconName: 'Radio',
      color: 'slate',
    },
    {
      id: 'database',
      label: '数据库查询',
      description: '历史数据读取',
      icon: Database,
      iconName: 'Database',
      color: 'slate',
    },
    {
      id: 'file',
      label: '文件监听',
      description: '本地文件变化监测',
      icon: FileJson,
      iconName: 'FileJson',
      color: 'slate',
    },
    {
      id: 'sensor',
      label: '传感器数据',
      description: '温度/压力/振动等',
      icon: Gauge,
      iconName: 'Gauge',
      color: 'slate',
    },
  ],
  atomicCapabilities: [
    {
      id: 'dongwei',
      label: '洞微感知',
      description: '视觉检测、缺陷识别、目标追踪',
      icon: Microscope,
      iconName: 'Microscope',
      color: 'violet',
      featured: true,
    },
    {
      id: 'gewu',
      label: '格物图谱',
      description: '知识推理、关联分析、根因定位',
      icon: Network,
      iconName: 'Network',
      color: 'emerald',
      featured: true,
    },
    {
      id: 'tianchou',
      label: '天筹优化',
      description: '排程优化、资源分配、决策求解',
      icon: Calculator,
      iconName: 'Calculator',
      color: 'blue',
      featured: true,
    },
    {
      id: 'huntian',
      label: '浑天仿真',
      description: '流程验证、场景模拟、效果预测',
      icon: Globe2,
      iconName: 'Globe2',
      color: 'cyan',
      featured: true,
    },
  ],
  dataProcessing: [
    {
      id: 'split',
      label: '数据分流',
      description: '多路分发',
      icon: GitBranch,
      iconName: 'GitBranch',
      color: 'amber',
    },
    {
      id: 'transform',
      label: '数据转换',
      description: '格式标准化',
      icon: RefreshCw,
      iconName: 'RefreshCw',
      color: 'amber',
    },
    {
      id: 'aggregate',
      label: '数据聚合',
      description: '多源合并',
      icon: Combine,
      iconName: 'Combine',
      color: 'amber',
    },
    {
      id: 'filter',
      label: '条件过滤',
      description: '规则筛选',
      icon: Filter,
      iconName: 'Filter',
      color: 'amber',
    },
    {
      id: 'delay',
      label: '延时器',
      description: '定时/延时触发',
      icon: Clock,
      iconName: 'Clock',
      color: 'amber',
    },
    {
      id: 'stats',
      label: '数据统计',
      description: '实时统计计算',
      icon: BarChart3,
      iconName: 'BarChart3',
      color: 'amber',
    },
  ],
  actions: [
    {
      id: 'robot',
      label: '机械臂控制',
      description: 'NG剔除/分拣',
      icon: Bot,
      iconName: 'Bot',
      color: 'rose',
    },
    {
      id: 'agv',
      label: 'AGV 调度',
      description: '物料运输调度',
      icon: Truck,
      iconName: 'Truck',
      color: 'rose',
    },
    {
      id: 'alarm',
      label: '报警触发',
      description: '异常告警推送',
      icon: AlertTriangle,
      iconName: 'AlertTriangle',
      color: 'rose',
    },
    {
      id: 'mqtt-send',
      label: '发送至 MQTT',
      description: '指令下发',
      icon: Cloud,
      iconName: 'Cloud',
      color: 'rose',
    },
    {
      id: 'notify',
      label: '消息通知',
      description: '邮件/短信/钉钉',
      icon: Mail,
      iconName: 'Mail',
      color: 'rose',
    },
    {
      id: 'db-write',
      label: '写入数据库',
      description: '结果持久化',
      icon: HardDrive,
      iconName: 'HardDrive',
      color: 'rose',
    },
  ],
}

// 颜色映射
const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  slate: {
    bg: 'bg-white',
    border: 'border-slate-300',
    text: 'text-slate-800',
    icon: 'text-slate-500',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    text: 'text-violet-900',
    icon: 'text-violet-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-900',
    icon: 'text-emerald-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-900',
    icon: 'text-blue-600',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-400',
    text: 'text-cyan-900',
    icon: 'text-cyan-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-900',
    icon: 'text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-400',
    text: 'text-rose-900',
    icon: 'text-rose-600',
  },
}

// 自定义节点组件
type CustomNodeData = {
  label: string
  description?: string
  color: string
  icon: string
  featured?: boolean
}

function CustomNode({ data, selected }: NodeProps<Node<CustomNodeData>>) {
  const nodeData = data as CustomNodeData
  const colors = colorMap[nodeData.color] || colorMap.slate
  const IconComponent =
    {
      Camera,
      Cpu,
      Radio,
      Database,
      FileJson,
      Gauge,
      Microscope,
      Network,
      Calculator,
      Globe2,
      GitBranch,
      RefreshCw,
      Combine,
      Filter,
      Clock,
      BarChart3,
      Bot,
      Truck,
      AlertTriangle,
      Cloud,
      Mail,
      HardDrive,
      Target,
    }[nodeData.icon] || Target

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
      />
      <div
        className={`
        px-4 py-3 rounded-lg border-2 shadow-sm min-w-[160px] cursor-move
        ${colors.bg} ${colors.border} ${colors.text}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${nodeData.featured ? 'ring-1 ring-offset-1' : ''}
        transition-all duration-200 hover:shadow-md
      `}
      >
        <div className="flex items-center gap-3">
          <div className={`${colors.icon}`}>
            <IconComponent size={20} />
          </div>
          <div>
            <div className="font-semibold text-sm">{nodeData.label}</div>
            {nodeData.description && (
              <div className="text-xs opacity-70 mt-0.5">{nodeData.description}</div>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
      />
    </motion.div>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

// 初始节点和边 - 预设的完整流程
const initialNodes: Node<CustomNodeData>[] = [
  // 数据源
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 80 },
    data: { label: '工业相机', description: 'Cam-01', color: 'slate', icon: 'Camera' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 50, y: 200 },
    data: { label: 'PLC 信号', description: '触发信号', color: 'slate', icon: 'Cpu' },
  },
  // 原子能力
  {
    id: '3',
    type: 'custom',
    position: { x: 280, y: 80 },
    data: {
      label: '洞微感知',
      description: '缺陷检测',
      color: 'violet',
      icon: 'Microscope',
      featured: true,
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 280, y: 200 },
    data: {
      label: '格物图谱',
      description: '根因分析',
      color: 'emerald',
      icon: 'Network',
      featured: true,
    },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 500, y: 140 },
    data: {
      label: '天筹优化',
      description: '处置决策',
      color: 'blue',
      icon: 'Calculator',
      featured: true,
    },
  },
  // 数据处理
  {
    id: '6',
    type: 'custom',
    position: { x: 500, y: 260 },
    data: { label: '数据分流', description: '多路分发', color: 'amber', icon: 'GitBranch' },
  },
  // 执行动作
  {
    id: '7',
    type: 'custom',
    position: { x: 720, y: 60 },
    data: { label: '机械臂控制', description: 'NG 剔除', color: 'rose', icon: 'Bot' },
  },
  {
    id: '8',
    type: 'custom',
    position: { x: 720, y: 140 },
    data: { label: 'AGV 调度', description: '物料运输', color: 'rose', icon: 'Truck' },
  },
  {
    id: '9',
    type: 'custom',
    position: { x: 720, y: 220 },
    data: { label: '报警触发', description: '异常告警', color: 'rose', icon: 'AlertTriangle' },
  },
  {
    id: '10',
    type: 'custom',
    position: { x: 720, y: 300 },
    data: { label: '发送至 MQTT', description: '数据上云', color: 'rose', icon: 'Cloud' },
  },
]

const initialEdges: Edge[] = [
  // 数据源到原子能力
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e1-4',
    source: '1',
    target: '4',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  // 原子能力之间
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  // 到执行动作
  {
    id: 'e5-7',
    source: '5',
    target: '7',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e5-8',
    source: '5',
    target: '8',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e6-9',
    source: '6',
    target: '9',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
  {
    id: 'e6-10',
    source: '6',
    target: '10',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
]

// 组件库项组件
interface ComponentItemProps {
  item: ComponentItem
  onDragStart: (event: React.DragEvent, item: ComponentItem) => void
}

function DraggableComponentItem({ item, onDragStart }: ComponentItemProps) {
  const colors = colorMap[item.color] || colorMap.slate
  const IconComponent = item.icon

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className={`
        p-3 rounded-lg border cursor-grab active:cursor-grabbing
        transition-all duration-200 hover:shadow-md hover:scale-[1.02]
        ${colors.bg} ${colors.border}
        ${item.featured ? 'ring-2 ring-offset-1 ring-violet-300' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <IconComponent size={18} className={colors.icon} />
        <div>
          <div className={`text-sm font-medium ${colors.text}`}>{item.label}</div>
          {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
        </div>
      </div>
    </div>
  )
}

// 可折叠组件分类组件
interface CollapsibleSectionProps {
  title: string
  titleColor: string
  icon: React.ReactNode
  items: ComponentItem[]
  onDragStart: (event: React.DragEvent, item: ComponentItem) => void
  defaultExpanded?: boolean
}

function CollapsibleSection({
  title,
  titleColor,
  icon,
  items,
  onDragStart,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const displayItems = isExpanded ? items : items.slice(0, 2)
  const hasMore = items.length > 2

  return (
    <div>
      <button
        type="button"
        onClick={() => hasMore && setIsExpanded(!isExpanded)}
        className={`text-xs font-bold uppercase mb-3 tracking-wider flex items-center gap-2 w-full text-left ${titleColor}`}
      >
        {hasMore ? (
          isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {icon} {title}
        {hasMore && <span className="font-normal text-slate-400 ml-auto">{items.length}</span>}
      </button>
      <div className="space-y-2">
        {displayItems.map((item) => (
          <DraggableComponentItem key={item.id} item={item} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

// 主画布组件
function FlowCanvas() {
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
      // 更新选中状态
      changes.forEach((change) => {
        if (change.type === 'select') {
          if (change.selected) {
            setSelectedNodes((prev) => [...prev, change.id])
          } else {
            setSelectedNodes((prev) => prev.filter((id) => id !== change.id))
          }
        }
      })
    },
    [setNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  )

  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((eds) => addEdge({ ...params, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds)),
    [setEdges]
  )

  // 拖拽添加节点
  const onDragStart = useCallback((event: React.DragEvent, item: ComponentItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const data = event.dataTransfer.getData('application/reactflow')
      if (!data) return

      const item = JSON.parse(data) as ComponentItem
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node<CustomNodeData> = {
        id: `${item.id}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: item.label,
          description: item.description,
          color: item.color,
          icon: item.iconName,
          featured: item.featured,
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition]
  )

  // 删除选中节点
  const deleteSelectedNodes = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)))
    setEdges((eds) =>
      eds.filter(
        (edge) => !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
      )
    )
    setSelectedNodes([])
  }, [selectedNodes])

  // 键盘事件
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedNodes()
      }
    },
    [deleteSelectedNodes]
  )

  // 重置画布
  const resetCanvas = useCallback(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNodes([])
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" onKeyDown={onKeyDown} tabIndex={0}>
      {/* Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-slate-800">PCB 缺陷检测流程</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedNodes.length > 0 && (
            <button
              type="button"
              onClick={deleteSelectedNodes}
              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} /> 删除 ({selectedNodes.length})
            </button>
          )}
          <button
            type="button"
            onClick={resetCanvas}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} /> 重置
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Save size={16} /> 保存
          </button>
          <button
            type="button"
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Play size={16} /> 部署运行
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Palette */}
        <div className="w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* 数据源 */}
            <CollapsibleSection
              title="数据源"
              titleColor="text-slate-500"
              icon={<Zap size={12} />}
              items={componentLibrary.dataSources}
              onDragStart={onDragStart}
            />

            {/* 原子能力 */}
            <CollapsibleSection
              title="原子能力"
              titleColor="text-violet-600"
              icon={<Brain size={12} />}
              items={componentLibrary.atomicCapabilities}
              onDragStart={onDragStart}
              defaultExpanded={true}
            />

            {/* 数据处理 */}
            <CollapsibleSection
              title="数据处理"
              titleColor="text-amber-600"
              icon={<RefreshCw size={12} />}
              items={componentLibrary.dataProcessing}
              onDragStart={onDragStart}
            />

            {/* 执行动作 */}
            <CollapsibleSection
              title="执行动作"
              titleColor="text-rose-600"
              icon={<Target size={12} />}
              items={componentLibrary.actions}
              onDragStart={onDragStart}
            />
          </div>

          {/* 使用提示 */}
          <div className="p-4 border-t border-slate-200 bg-white/50">
            <div className="text-xs text-slate-500 space-y-1">
              <p>• 拖拽组件到画布添加节点</p>
              <p>• 拖拽节点可移动位置</p>
              <p>• 从锚点拖拽创建连接</p>
              <p>• 选中节点后按 Delete 删除</p>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
            <Controls
              className="!bg-white !border !border-slate-200 !rounded-lg !shadow-sm"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

// 主组件（带 Provider）
const ScenarioBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}

export default ScenarioBuilder
