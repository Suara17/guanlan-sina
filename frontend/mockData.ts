import type {
  AnomalyDetail,
  DashboardMetrics,
  KnowledgeGraph,
  ProductionLine,
  SolutionOption,
} from './types'

// 9条产线
export const PRODUCTION_LINES: ProductionLine[] = [
  { id: 'smt-a01', name: 'SMT智能产线A01', type: 'SMT', status: 'running' },
  { id: 'smt-a02', name: 'SMT智能产线A02', type: 'SMT', status: 'running' },
  { id: 'smt-a03', name: 'SMT智能产线A03', type: 'SMT', status: 'error' },
  { id: 'pcb-b01', name: 'PCB智能产线B01', type: 'PCB', status: 'running' },
  { id: 'pcb-b02', name: 'PCB智能产线B02', type: 'PCB', status: 'idle' },
  { id: 'pcb-b03', name: 'PCB智能产线B03', type: 'PCB', status: 'running' },
  { id: '3c-c01', name: '3C智能产线C01', type: '3C', status: 'running' },
  { id: '3c-c02', name: '3C智能产线C02', type: '3C', status: 'running' },
  { id: '3c-c03', name: '3C智能产线C03', type: '3C', status: 'error' },
]

// Dashboard指标数据
export const DASHBOARD_METRICS: Record<string, DashboardMetrics> = {
  'smt-a01': {
    completionRate: 92.5,
    actualProduction: 1850,
    plannedProduction: 2000,
    attendance: 24,
    efficiency: 88.3,
    outputValue: 42.8,
  },
  'smt-a02': {
    completionRate: 78.2,
    actualProduction: 1564,
    plannedProduction: 2000,
    attendance: 23,
    efficiency: 76.5,
    outputValue: 36.2,
  },
  'smt-a03': {
    completionRate: 45.8,
    actualProduction: 916,
    plannedProduction: 2000,
    attendance: 22,
    efficiency: 52.1,
    outputValue: 21.2,
  },
  'pcb-b01': {
    completionRate: 96.3,
    actualProduction: 1926,
    plannedProduction: 2000,
    attendance: 18,
    efficiency: 94.2,
    outputValue: 38.5,
  },
  'pcb-b02': {
    completionRate: 0,
    actualProduction: 0,
    plannedProduction: 1800,
    attendance: 0,
    efficiency: 0,
    outputValue: 0,
  },
  'pcb-b03': {
    completionRate: 83.7,
    actualProduction: 1507,
    plannedProduction: 1800,
    attendance: 19,
    efficiency: 81.4,
    outputValue: 30.1,
  },
  '3c-c01': {
    completionRate: 89.4,
    actualProduction: 1788,
    plannedProduction: 2000,
    attendance: 32,
    efficiency: 87.2,
    outputValue: 58.6,
  },
  '3c-c02': {
    completionRate: 91.8,
    actualProduction: 1836,
    plannedProduction: 2000,
    attendance: 31,
    efficiency: 89.5,
    outputValue: 60.2,
  },
  '3c-c03': {
    completionRate: 56.3,
    actualProduction: 1126,
    plannedProduction: 2000,
    attendance: 28,
    efficiency: 61.8,
    outputValue: 36.9,
  },
}

// SMT产线异常
export const SMT_ANOMALIES: AnomalyDetail[] = [
  {
    id: 'smt-001',
    time: '14:32',
    level: 'critical',
    location: 'SMT贴片机#3',
    message: '吸嘴漏气，连续3次检测失败',
    lineType: 'SMT',
    description: 'SMT贴片机#3吸嘴漏气，连续3次检测失败',
    rootCause: '吸嘴密封圈老化',
    solutions: ['更换密封圈', '调整吸嘴压力', '校准真空泵'],
  },
  {
    id: 'smt-002',
    time: '13:15',
    level: 'error',
    location: '回流焊炉#2',
    message: '温度异常，实际温度低于设定值15°C',
    lineType: 'SMT',
    description: '回流焊炉#2预热区温度异常，实际温度低于设定值15°C',
    rootCause: '加热元件故障',
    solutions: ['更换加热元件', '检查温控系统', '校准温度传感器'],
  },
  {
    id: 'smt-003',
    time: '11:48',
    level: 'warning',
    location: 'AOI检测设备#1',
    message: '识别率下降至85%',
    lineType: 'SMT',
    description: 'AOI检测设备#1元件识别率下降至85%，标准要求≥95%',
    rootCause: '摄像头镜头污染',
    solutions: ['清洁摄像头镜头', '重新校准识别算法', '更新照明系统'],
  },
  {
    id: 'smt-004',
    time: '10:22',
    level: 'error',
    location: '锡膏印刷机#2',
    message: '印刷厚度超标，CPK值0.8',
    lineType: 'SMT',
    description: '锡膏印刷机#2印刷厚度超标，CPK值0.8，标准要求≥1.33',
    rootCause: '刮刀磨损',
    solutions: ['更换刮刀', '调整印刷压力', '清洁钢网'],
  },
  {
    id: 'smt-005',
    time: '09:45',
    level: 'critical',
    location: '贴片机#1',
    message: '飞达故障，元件供应中断',
    lineType: 'SMT',
    description: '贴片机#1飞达机械故障，元件供应中断',
    rootCause: '飞达传动齿轮损坏',
    solutions: ['更换飞达', '检查传动系统', '维护供料器'],
  },
  {
    id: 'smt-006',
    time: '08:30',
    level: 'warning',
    location: '波峰焊设备#3',
    message: '焊锡温度波动±10°C',
    lineType: 'SMT',
    description: '波峰焊设备#3焊锡温度波动±10°C，影响焊接质量',
    rootCause: '温控器精度下降',
    solutions: ['更换温控器', '检查加热管', '优化PID参数'],
  },
]

// PCB产线异常
export const PCB_ANOMALIES: AnomalyDetail[] = [
  {
    id: 'pcb-001',
    time: '15:20',
    level: 'critical',
    location: '数控钻床#2',
    message: '主轴异响，定位精度偏差0.05mm',
    lineType: 'PCB',
    description: '数控钻床#2主轴异响，定位精度偏差0.05mm，标准要求≤0.02mm',
    rootCause: '主轴轴承磨损',
    solutions: ['更换主轴轴承', '检查润滑系统', '校准机械精度'],
  },
  {
    id: 'pcb-002',
    time: '14:10',
    level: 'error',
    location: '沉铜生产线#1',
    message: '化学铜沉积速率异常',
    lineType: 'PCB',
    description: '沉铜生产线#1化学铜沉积速率异常，孔壁铜厚不均匀',
    rootCause: '药液浓度失衡',
    solutions: ['调整药液配比', '更换过滤系统', '维护搅拌装置'],
  },
  {
    id: 'pcb-003',
    time: '12:35',
    level: 'warning',
    location: '蚀刻生产线#3',
    message: '侧蚀严重，线宽偏差15%',
    lineType: 'PCB',
    description: '蚀刻生产线#3侧蚀严重，线宽偏差15%，标准要求≤10%',
    rootCause: '蚀刻液温度过高',
    solutions: ['降低蚀刻液温度', '调整传送速度', '更新蚀刻液'],
  },
  {
    id: 'pcb-004',
    time: '11:15',
    level: 'error',
    location: '绿油涂布设备#2',
    message: '涂层厚度不均匀，局部过厚',
    lineType: 'PCB',
    description: '绿油涂布设备#2涂层厚度不均匀，局部过厚影响阻焊效果',
    rootCause: '涂布辊磨损不均',
    solutions: ['更换涂布辊', '调整涂布压力', '校准厚度控制系统'],
  },
  {
    id: 'pcb-005',
    time: '09:50',
    level: 'critical',
    location: '层压机#1',
    message: '压力异常，真空度不足',
    lineType: 'PCB',
    description: '层压机#1压力异常，真空度不足导致分层气泡',
    rootCause: '真空泵密封失效',
    solutions: ['更换真空泵密封件', '检查真空管路', '维护压力传感器'],
  },
  {
    id: 'pcb-006',
    time: '08:25',
    level: 'warning',
    location: '电镀生产线#2',
    message: '镀铜均匀性下降，厚度偏差20%',
    lineType: 'PCB',
    description: '电镀生产线#2镀铜均匀性下降，厚度偏差20%，标准要求≤15%',
    rootCause: '阳极分布不均',
    solutions: ['调整阳极布局', '优化电流密度', '维护循环系统'],
  },
]

// 3C产线异常
export const THREE_C_ANOMALIES: AnomalyDetail[] = [
  {
    id: '3c-001',
    time: '16:05',
    level: 'critical',
    location: '激光切割机#3',
    message: '激光功率下降，切割质量不达标',
    lineType: '3C',
    description: '激光切割机#3激光功率下降30%，切割面粗糙度超标',
    rootCause: '激光器老化',
    solutions: ['更换激光器', '清洁光学系统', '校准功率控制器'],
  },
  {
    id: '3c-002',
    time: '14:40',
    level: 'error',
    location: 'CNC加工中心#2',
    message: '主轴径向跳动0.03mm',
    lineType: '3C',
    description: 'CNC加工中心#2主轴径向跳动0.03mm，加工精度下降',
    rootCause: '主轴轴承预紧力不足',
    solutions: ['调整轴承预紧力', '检查主轴动平衡', '更换轴承'],
  },
  {
    id: '3c-003',
    time: '13:20',
    level: 'warning',
    location: '注塑机#5',
    message: '注射压力波动±8%',
    lineType: '3C',
    description: '注塑机#5注射压力波动±8%，产品重量一致性下降',
    rootCause: '液压油温过高',
    solutions: ['降低液压油温', '检查冷却系统', '更换液压油'],
  },
  {
    id: '3c-004',
    time: '11:55',
    level: 'error',
    location: '超声波焊接机#1',
    message: '焊接强度下降，不良率上升至8%',
    lineType: '3C',
    description: '超声波焊接机#1焊接强度下降，不良率上升至8%，标准要求≤3%',
    rootCause: '焊头频率偏移',
    solutions: ['重新校准频率', '更换焊头', '调整振幅参数'],
  },
  {
    id: '3c-005',
    time: '10:30',
    level: 'critical',
    location: '自动装配线#3',
    message: '机器人手臂定位异常',
    lineType: '3C',
    description: '自动装配线#3机器人手臂定位异常，装配错误率上升',
    rootCause: '编码器故障',
    solutions: ['更换编码器', '检查伺服驱动器', '重新校准坐标系'],
  },
  {
    id: '3c-006',
    time: '09:15',
    level: 'warning',
    location: '测试线#2',
    message: '测试数据异常，误判率增加',
    lineType: '3C',
    description: '测试线#2测试数据异常，误判率增加至5%，标准要求≤2%',
    rootCause: '测试夹具接触不良',
    solutions: ['清洁测试夹具', '更换探针', '校准测试设备'],
  },
]

// 知识图谱数据（示例：SMT贴片机吸嘴漏气）
export const KNOWLEDGE_GRAPH_SMT_001: KnowledgeGraph = {
  anomalyId: 'smt-001',
  nodes: [
    { id: 'n1', type: 'phenomenon', label: '异常现象', description: 'SMT贴片机#3吸嘴漏气' },
    { id: 'n2', type: 'cause', label: '直接原因', description: '真空压力不足' },
    { id: 'n3', type: 'cause', label: '根本原因1', description: '吸嘴密封圈老化' },
    { id: 'n4', type: 'cause', label: '根本原因2', description: '真空泵功率下降' },
    { id: 'n5', type: 'solution', label: '解决方案1', description: '更换密封圈（5分钟）' },
    { id: 'n6', type: 'solution', label: '解决方案2', description: '校准真空泵（15分钟）' },
    { id: 'n7', type: 'solution', label: '解决方案3', description: '更换真空泵（120分钟）' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', type: 'leads_to' },
    { id: 'e2', source: 'n2', target: 'n3', type: 'caused_by' },
    { id: 'e3', source: 'n2', target: 'n4', type: 'caused_by' },
    { id: 'e4', source: 'n3', target: 'n5', type: 'solved_by' },
    { id: 'e5', source: 'n4', target: 'n6', type: 'solved_by' },
    { id: 'e6', source: 'n4', target: 'n7', type: 'solved_by' },
  ],
}

// 知识图谱数据（示例：PCB数控钻床主轴异响）
export const KNOWLEDGE_GRAPH_PCB_001: KnowledgeGraph = {
  anomalyId: 'pcb-001',
  nodes: [
    { id: 'n1', type: 'phenomenon', label: '异常现象', description: '数控钻床#2主轴异响' },
    { id: 'n2', type: 'cause', label: '直接原因', description: '主轴振动异常' },
    { id: 'n3', type: 'cause', label: '根本原因1', description: '主轴轴承磨损' },
    { id: 'n4', type: 'cause', label: '根本原因2', description: '润滑系统故障' },
    { id: 'n5', type: 'solution', label: '解决方案1', description: '更换主轴轴承（60分钟）' },
    { id: 'n6', type: 'solution', label: '解决方案2', description: '维修润滑系统（30分钟）' },
    { id: 'n7', type: 'solution', label: '解决方案3', description: '更换主轴总成（180分钟）' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', type: 'leads_to' },
    { id: 'e2', source: 'n2', target: 'n3', type: 'caused_by' },
    { id: 'e3', source: 'n2', target: 'n4', type: 'caused_by' },
    { id: 'e4', source: 'n3', target: 'n5', type: 'solved_by' },
    { id: 'e5', source: 'n4', target: 'n6', type: 'solved_by' },
    { id: 'e6', source: 'n3', target: 'n7', type: 'solved_by' },
  ],
}

// 知识图谱数据（示例：3C激光切割机功率下降）
export const KNOWLEDGE_GRAPH_3C_001: KnowledgeGraph = {
  anomalyId: '3c-001',
  nodes: [
    { id: 'n1', type: 'phenomenon', label: '异常现象', description: '激光切割机#3功率下降' },
    { id: 'n2', type: 'cause', label: '直接原因', description: '激光输出能量不足' },
    { id: 'n3', type: 'cause', label: '根本原因1', description: '激光器老化' },
    { id: 'n4', type: 'cause', label: '根本原因2', description: '光学系统污染' },
    { id: 'n5', type: 'solution', label: '解决方案1', description: '更换激光器（90分钟）' },
    { id: 'n6', type: 'solution', label: '解决方案2', description: '清洁光学系统（20分钟）' },
    { id: 'n7', type: 'solution', label: '解决方案3', description: '升级激光源（120分钟）' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', type: 'leads_to' },
    { id: 'e2', source: 'n2', target: 'n3', type: 'caused_by' },
    { id: 'e3', source: 'n2', target: 'n4', type: 'caused_by' },
    { id: 'e4', source: 'n3', target: 'n5', type: 'solved_by' },
    { id: 'e5', source: 'n4', target: 'n6', type: 'solved_by' },
    { id: 'e6', source: 'n3', target: 'n7', type: 'solved_by' },
  ],
}

// 获取产线异常数据的辅助函数
export const getAnomaliesByLineType = (lineType: 'SMT' | 'PCB' | '3C'): AnomalyDetail[] => {
  switch (lineType) {
    case 'SMT':
      return SMT_ANOMALIES
    case 'PCB':
      return PCB_ANOMALIES
    case '3C':
      return THREE_C_ANOMALIES
    default:
      return []
  }
}

// 获取知识图谱数据的辅助函数
export const getKnowledgeGraphByAnomalyId = (anomalyId: string): KnowledgeGraph | null => {
  switch (anomalyId) {
    case 'smt-001':
      return KNOWLEDGE_GRAPH_SMT_001
    case 'pcb-001':
      return KNOWLEDGE_GRAPH_PCB_001
    case '3c-001':
      return KNOWLEDGE_GRAPH_3C_001
    default:
      return null
  }
}

// 获取异常详情的辅助函数
export const getAnomalyById = (anomalyId: string): AnomalyDetail | null => {
  const allAnomalies = [...SMT_ANOMALIES, ...PCB_ANOMALIES, ...THREE_C_ANOMALIES]
  return allAnomalies.find((anomaly) => anomaly.id === anomalyId) || null
}
