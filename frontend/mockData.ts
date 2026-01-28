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
  'smt-a01': { completionRate: 92.5, actualProduction: 1850, plannedProduction: 2000, attendance: 24, efficiency: 88.3, outputValue: 42.8 },
  'smt-a02': { completionRate: 78.2, actualProduction: 1564, plannedProduction: 2000, attendance: 23, efficiency: 76.5, outputValue: 36.2 },
  'smt-a03': { completionRate: 45.8, actualProduction: 916, plannedProduction: 2000, attendance: 22, efficiency: 52.1, outputValue: 21.2 },
  'pcb-b01': { completionRate: 96.3, actualProduction: 1926, plannedProduction: 2000, attendance: 18, efficiency: 94.2, outputValue: 38.5 },
  'pcb-b02': { completionRate: 0, actualProduction: 0, plannedProduction: 1800, attendance: 0, efficiency: 0, outputValue: 0 },
  'pcb-b03': { completionRate: 83.7, actualProduction: 1507, plannedProduction: 1800, attendance: 19, efficiency: 81.4, outputValue: 30.1 },
  '3c-c01': { completionRate: 89.4, actualProduction: 1788, plannedProduction: 2000, attendance: 32, efficiency: 87.2, outputValue: 58.6 },
  '3c-c02': { completionRate: 91.8, actualProduction: 1836, plannedProduction: 2000, attendance: 31, efficiency: 89.5, outputValue: 60.2 },
  '3c-c03': { completionRate: 56.3, actualProduction: 1126, plannedProduction: 2000, attendance: 28, efficiency: 61.8, outputValue: 36.9 },
}

// SMT产线异常
export const SMT_ANOMALIES: AnomalyDetail[] = [
  {
    "id": "smt-001",
    "time": "17:13",
    "level": "error",
    "location": "SMT设备#5",
    "message": "贴装精度下降",
    "lineType": "SMT",
    "description": "贴装精度下降",
    "rootCause": "产线布局密度过大（间距<0.8m）形成热岛效应，阻碍自然对流散热",
    "solutions": [
      "增加局部辅助散热风扇，降低机台温升",
      "部署动态热补偿系统，根据实时温度修正坐标",
      "重新规划产线布局，确保设备间距大于1.2米"
    ]
  },
  {
    "id": "smt-002",
    "time": "11:40",
    "level": "warning",
    "location": "SMT设备#2",
    "message": "后续贴装不良",
    "lineType": "SMT",
    "description": "后续贴装不良",
    "rootCause": "冷却区有效长度（2米）与传送带速度不匹配，无法提供足够的热交换时间",
    "solutions": [
      "在出口处增加临时冷气风刀，加速冷却",
      "加长冷却区至3米，或升级为高效水冷模块",
      "降低传送带速度（牺牲部分产能）以保证冷却时间"
    ]
  },
  {
    "id": "smt-004",
    "time": "10:48",
    "level": "warning",
    "location": "SMT设备#3",
    "message": "元件抛料与偏位",
    "lineType": "SMT",
    "description": "元件抛料与偏位",
    "rootCause": "真空发生器过滤棉堵塞，导致气流受阻，负压建立不全",
    "solutions": [
      "立即清洗吸嘴，更换老化O型密封圈",
      "建立吸嘴真空压力实时监控与自动报警系统",
      "定期（每周）检查并更换真空过滤棉"
    ]
  },
  {
    "id": "smt-005",
    "time": "16:16",
    "level": "warning",
    "location": "SMT设备#5",
    "message": "焊膏连锡",
    "lineType": "SMT",
    "description": "焊膏连锡",
    "rootCause": "钢网张力不足导致中间下垂，操作员错误增加压力以求刮净",
    "solutions": [
      "调整刮刀压力至标准值（0.25kg/cm长度）",
      "部署SPI（锡膏检测）与印刷机闭环反馈控制",
      "更换张力合格的钢网，严禁通过加压补偿"
    ]
  },
  {
    "id": "smt-011",
    "time": "13:11",
    "level": "warning",
    "location": "SMT设备#2",
    "message": "掉板/卡板",
    "lineType": "SMT",
    "description": "掉板/卡板",
    "rootCause": "导轨调宽机构丝杆受热卡死，无法自动补偿热胀",
    "solutions": [
      "调整导轨间隙，预留热膨胀余量",
      "使用低热膨胀系数材料（如钛合金）改造导轨",
      "清理润滑丝杆，使用高温润滑脂"
    ]
  }
]

// PCB产线异常
export const PCB_ANOMALIES: AnomalyDetail[] = [
  {
    "id": "pcb-003",
    "time": "11:54",
    "level": "error",
    "location": "PCB设备#4",
    "message": "曝光精度下降",
    "lineType": "PCB",
    "description": "曝光精度下降",
    "rootCause": "传输距离过长（8米）且无环境温度控制，导致板面温度在进入曝光机前波动过大",
    "solutions": [
      "缩短传输时间，或在传输段加装保温罩",
      "在曝光机入口增加板材温度调理缓存区",
      "调整设备布局，将层压与曝光工序间距缩短至3米内"
    ]
  },
  {
    "id": "pcb-006",
    "time": "17:31",
    "level": "warning",
    "location": "PCB设备#2",
    "message": "干膜起泡",
    "lineType": "PCB",
    "description": "干膜起泡",
    "rootCause": "加热辊内部温控传感器漂移，显示温度低于实际温度",
    "solutions": [
      "降低层压温度设定至110±5℃",
      "安装非接触式红外测温仪实时监控辊面温度",
      "校准温度传感器，进行多点温度均匀性测试"
    ]
  },
  {
    "id": "pcb-007",
    "time": "14:41",
    "level": "warning",
    "location": "PCB设备#3",
    "message": "粉尘残留刮花板面",
    "lineType": "PCB",
    "description": "粉尘残留刮花板面",
    "rootCause": "中央集尘系统支管风阀调节不当，导致末端风压不足",
    "solutions": [
      "清理吸尘管路堵塞，更换集尘袋",
      "加装负压传感器，设定低压停机保护",
      "调节风阀平衡各机台风量，确保末端压力"
    ]
  },
  {
    "id": "pcb-008",
    "time": "09:12",
    "level": "error",
    "location": "PCB设备#5",
    "message": "线路宽窄不一",
    "lineType": "PCB",
    "description": "线路宽窄不一",
    "rootCause": "部分喷嘴被结晶堵塞，导致局部压力升高或降低",
    "solutions": [
      "调整喷淋泵频率，平衡上下喷嘴压力",
      "安装电子压力表，实现压力波动报警",
      "拆洗喷嘴，清理结晶，更换磨损喷嘴"
    ]
  },
  {
    "id": "pcb-010",
    "time": "09:01",
    "level": "error",
    "location": "PCB设备#4",
    "message": "板厚超差",
    "lineType": "PCB",
    "description": "板厚超差",
    "rootCause": "液压主油缸密封圈老化泄漏，导致保压不稳",
    "solutions": [
      "检查液压泵站，补充液压油，排气",
      "升级伺服液压系统，实现精密压力闭环控制",
      "更换全套油缸密封组件"
    ]
  }
]

// 3C产线异常
export const THREE_C_ANOMALIES: AnomalyDetail[] = [
  {
    "id": "3c-009",
    "time": "11:30",
    "level": "critical",
    "location": "3C设备#1",
    "message": "外壳开裂",
    "lineType": "3C",
    "description": "外壳开裂",
    "rootCause": "电批内部离合器磨损，导致扭力设定值失效（打滑或锁死）",
    "solutions": [
      "下调电批扭力至3.5kgf.cm，更换限力电批",
      "使用伺服智能电批，监控锁付扭力曲线",
      "更换磨损离合器弹簧，修复电批"
    ]
  }
]

// 知识图谱数据
export const KNOWLEDGE_GRAPH_SMT_001: KnowledgeGraph = {
  "anomalyId": "smt-001",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "贴装精度下降"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "设备内部温升超过环境温度10℃，导致龙门架热膨胀产生15µm位移"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "增加局部辅助散热风扇，降低机台温升"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "部署动态热补偿系统，根据实时温度修正坐标"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "产线布局密度过大（间距<0.8m）形成热岛效应，阻碍自然对流散热"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "重新规划产线布局，确保设备间距大于1.2米"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "建立产线热仿真模型，在布局阶段评估散热风险"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "缺乏针对高密度布局的动态热补偿校准机制"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "定期进行激光干涉仪校准，更新热补偿参数"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "升级设备控制软件，引入AI热误差预测补偿算法"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_SMT_002: KnowledgeGraph = {
  "anomalyId": "smt-002",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "后续贴装不良"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "PCB出炉温度超过50℃（焊点未完全固化），在机械传输中发生位移"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "在出口处增加临时冷气风刀，加速冷却"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "加长冷却区至3米，或升级为高效水冷模块"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "冷却区有效长度（2米）与传送带速度不匹配，无法提供足够的热交换时间"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "降低传送带速度（牺牲部分产能）以保证冷却时间"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "引入智能闭环冷却系统，根据板温自动调节风扇转速"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "产能提升导致传送带速度调快，超出了现有冷却模块的热负荷设计上限"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "恢复标准炉温曲线设定，限制最大产能"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "采购双轨回流焊设备，在低速下保证产能和冷却效果"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_PCB_003: KnowledgeGraph = {
  "anomalyId": "pcb-003",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "曝光精度下降"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "PCB板在传输过程中发生非均匀热收缩，导致靶点位置偏移超过20µm"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "缩短传输时间，或在传输段加装保温罩"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "在曝光机入口增加板材温度调理缓存区"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "传输距离过长（8米）且无环境温度控制，导致板面温度在进入曝光机前波动过大"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "调整设备布局，将层压与曝光工序间距缩短至3米内"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "改造传输通道，安装恒温恒湿控制系统"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "曝光机对位系统未配置实时板材涨缩补偿功能"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "人工手动测量板件涨缩系数并输入设备补偿"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "升级曝光机CCD对位系统，支持自动涨缩分级补偿"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_SMT_004: KnowledgeGraph = {
  "anomalyId": "smt-004",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "元件抛料与偏位"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "真空负压值低于阈值53kPa，无法提供足够吸附力克服元件运动惯性"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "立即清洗吸嘴，更换老化O型密封圈"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "建立吸嘴真空压力实时监控与自动报警系统"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "真空发生器过滤棉堵塞，导致气流受阻，负压建立不全"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "定期（每周）检查并更换真空过滤棉"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "引入数字式真空压力表，数字化管理负压数据"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "设备保养计划未包含真空回路的深度清洁"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "修订设备保养SOP，增加真空回路气压流量测试"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "实施预测性维护，根据压力衰减趋势提前预警"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_SMT_005: KnowledgeGraph = {
  "anomalyId": "smt-005",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "焊膏连锡"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "刮刀压力超过标准范围（1-3kg），导致焊膏被挤出焊盘边界或被挖空"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "调整刮刀压力至标准值（0.25kg/cm长度）"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "部署SPI（锡膏检测）与印刷机闭环反馈控制"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "钢网张力不足导致中间下垂，操作员错误增加压力以求刮净"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "更换张力合格的钢网，严禁通过加压补偿"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "建立钢网张力全生命周期管理与定期测试流程"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "缺乏标准的印刷参数工艺窗口验证（DOE）"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "开展印刷工艺DOE，确定最佳压力/速度组合"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "引入自动刮刀压力控制系统，恒定刮刀压力"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_PCB_006: KnowledgeGraph = {
  "anomalyId": "pcb-006",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "干膜起泡"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "层压辊表面温度超过干膜耐受极限（120℃），导致膜内挥发分急剧膨胀"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "降低层压温度设定至110±5℃"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "安装非接触式红外测温仪实时监控辊面温度"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "加热辊内部温控传感器漂移，显示温度低于实际温度"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "校准温度传感器，进行多点温度均匀性测试"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "定期（每月）使用外置测温仪比对校正设备温控"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "不同批次干膜的工艺窗口参数未验证即上线"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "每批次新干膜上线前必须进行工艺窗口测试"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "建立材料-工艺参数数据库，自动匹配最佳参数"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_PCB_007: KnowledgeGraph = {
  "anomalyId": "pcb-007",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "粉尘残留刮花板面"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "吸尘口负压低于15kPa，无法有效带走钻孔产生的高温钻屑"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "清理吸尘管路堵塞，更换集尘袋"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "加装负压传感器，设定低压停机保护"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "中央集尘系统支管风阀调节不当，导致末端风压不足"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "调节风阀平衡各机台风量，确保末端压力"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "升级变频集尘系统，根据开启机台数自动调节风机频率"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "吸尘软管破损漏气，长期未被发现"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "定期检查吸尘管路密封性"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "实施设备点检数字化，强制记录关键压力参数"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_PCB_008: KnowledgeGraph = {
  "anomalyId": "pcb-008",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "线路宽窄不一"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "上下喷嘴压力差超过0.5bar，导致板面药水交换速率差异"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "调整喷淋泵频率，平衡上下喷嘴压力"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "安装电子压力表，实现压力波动报警"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "部分喷嘴被结晶堵塞，导致局部压力升高或降低"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "拆洗喷嘴，清理结晶，更换磨损喷嘴"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "增加药水在线过滤精度，防止结晶颗粒堵塞"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "喷淋管路布局设计不合理，存在压力衰减盲区"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "优化喷淋管路设计，采用歧管平衡压力"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "引入摇摆喷淋系统，消除固定喷淋留下的死角"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_3C_009: KnowledgeGraph = {
  "anomalyId": "3c-009",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "外壳开裂"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "电批输出扭力超过外壳材料屈服极限（>5kgf.cm）"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "下调电批扭力至3.5kgf.cm，更换限力电批"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "使用伺服智能电批，监控锁付扭力曲线"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "电批内部离合器磨损，导致扭力设定值失效（打滑或锁死）"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "更换磨损离合器弹簧，修复电批"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "实施电批扭力每日点检（CPK管理）"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "来料外壳注塑内应力大，降低了抗裂强度"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "反馈注塑供应商优化退火工艺，消除内应力"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "从来料检验端增加破坏性扭力测试抽检"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_PCB_010: KnowledgeGraph = {
  "anomalyId": "pcb-010",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "板厚超差"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "层压保压阶段压力波动超过设定值±5%，导致半固化片流胶不均"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "检查液压泵站，补充液压油，排气"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "升级伺服液压系统，实现精密压力闭环控制"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "液压主油缸密封圈老化泄漏，导致保压不稳"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "更换全套油缸密封组件"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "建立液压系统预防性维护计划，定期更换密封件"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "压力传感器零点漂移，反馈错误压力信号"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "校准压力传感器"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "采用双压力传感器冗余校验机制"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
}
export const KNOWLEDGE_GRAPH_SMT_011: KnowledgeGraph = {
  "anomalyId": "smt-011",
  "nodes": [
    {
      "id": "n1",
      "type": "phenomenon",
      "label": "异常现象",
      "description": "掉板/卡板"
    },
    {
      "id": "n2",
      "type": "cause",
      "label": "直接原因",
      "description": "炉温250℃下导轨受热伸长，宽度发生变化，超过PCB板宽公差"
    },
    {
      "id": "n3",
      "type": "solution",
      "label": "临时方案",
      "description": "调整导轨间隙，预留热膨胀余量"
    },
    {
      "id": "n4",
      "type": "solution",
      "label": "长期方案",
      "description": "使用低热膨胀系数材料（如钛合金）改造导轨"
    },
    {
      "id": "n5",
      "type": "cause",
      "label": "根本原因1",
      "description": "导轨调宽机构丝杆受热卡死，无法自动补偿热胀"
    },
    {
      "id": "n6",
      "type": "solution",
      "label": "临时方案",
      "description": "清理润滑丝杆，使用高温润滑脂"
    },
    {
      "id": "n7",
      "type": "solution",
      "label": "长期方案",
      "description": "升级自动调宽系统，带热补偿功能"
    },
    {
      "id": "n8",
      "type": "cause",
      "label": "根本原因2",
      "description": "PCB板材Tg点低，在高温下变软下垂，加剧了对导轨精度的敏感度"
    },
    {
      "id": "n9",
      "type": "solution",
      "label": "临时方案",
      "description": "使用治具过炉，支撑PCB板防止下垂"
    },
    {
      "id": "n10",
      "type": "solution",
      "label": "长期方案",
      "description": "评估改用高Tg板材或优化炉温曲线降低峰值热冲击"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "leads_to"
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "type": "solved_by"
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "type": "solved_by"
    },
    {
      "id": "e4",
      "source": "n2",
      "target": "n5",
      "type": "caused_by"
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "type": "solved_by"
    },
    {
      "id": "e6",
      "source": "n5",
      "target": "n7",
      "type": "solved_by"
    },
    {
      "id": "e7",
      "source": "n2",
      "target": "n8",
      "type": "caused_by"
    },
    {
      "id": "e8",
      "source": "n8",
      "target": "n9",
      "type": "solved_by"
    },
    {
      "id": "e9",
      "source": "n8",
      "target": "n10",
      "type": "solved_by"
    }
  ]
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
    case 'smt-002':
      return KNOWLEDGE_GRAPH_SMT_002
    case 'pcb-003':
      return KNOWLEDGE_GRAPH_PCB_003
    case 'smt-004':
      return KNOWLEDGE_GRAPH_SMT_004
    case 'smt-005':
      return KNOWLEDGE_GRAPH_SMT_005
    case 'pcb-006':
      return KNOWLEDGE_GRAPH_PCB_006
    case 'pcb-007':
      return KNOWLEDGE_GRAPH_PCB_007
    case 'pcb-008':
      return KNOWLEDGE_GRAPH_PCB_008
    case '3c-009':
      return KNOWLEDGE_GRAPH_3C_009
    case 'pcb-010':
      return KNOWLEDGE_GRAPH_PCB_010
    case 'smt-011':
      return KNOWLEDGE_GRAPH_SMT_011
    default:
      return null
  }
}

// 获取异常详情的辅助函数
export const getAnomalyById = (anomalyId: string): AnomalyDetail | null => {
  const allAnomalies = [...SMT_ANOMALIES, ...PCB_ANOMALIES, ...THREE_C_ANOMALIES]
  return allAnomalies.find((anomaly) => anomaly.id === anomalyId) || null
}
