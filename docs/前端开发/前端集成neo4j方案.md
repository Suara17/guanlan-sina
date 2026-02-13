# 前端 Neo4j 知识图谱集成方案

## 现状分析

### 现有知识图谱功能架构

#### 1. 核心组件
- **KnowledgeGraphCanvas.tsx**: 基于D3.js的动态力导向图可视化组件
- **KnowledgeGraphPage.tsx**: 专门的知识图谱页面，展示异常传播路径
- **NodeDetailPanel.tsx**: 节点详情展示面板
- **SinanAnalysis.tsx**: 司南智能诊断中心页面

#### 2. 数据模型
```typescript
// 现有类型定义（与Neo4j模型完全兼容）
interface KnowledgeNode {
  id: string
  type: 'phenomenon' | 'cause' | 'solution'
  label: string
  description: string
  x?: number
  y?: number
}

interface KnowledgeEdge {
  id: string
  source: string
  target: string
  type: 'leads_to' | 'caused_by' | 'solved_by'
  label?: string
}

interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  anomalyId: string
}
```

#### 3. 模拟数据覆盖
- **11个完整知识图谱数据集**，覆盖SMT、PCB、3C组装产线
- **数据结构完整**，包含异常现象、根本原因、解决方案
- **可视化效果成熟**，D3.js力导向图，节点拖拽，动画效果

### 技术栈优势
- **React 19 + TypeScript**: 类型安全
- **D3.js**: 专业图可视化
- **Tailwind CSS**: 现代化UI
- **完整API客户端**: 基于OpenAPI规范

## 集成架构设计

### 混合数据源架构
```
┌─────────────────────────────────────────────────────────┐
│                    前端应用层                            │
├─────────────────────────────────────────────────────────┤
│  KnowledgeGraphPage  │    SinanAnalysis                 │
│  (完整图谱可视化)     │    (静态CSS→动态图谱)           │
├─────────────────────────────────────────────────────────┤
│                 数据转换层                              │
│  Neo4jDataAdapter  │    MockDataAdapter               │
├─────────────────────────────────────────────────────────┤
│                 API 访问层                              │
│   Neo4j API服务    │    现有API服务                    │
├─────────────────────────────────────────────────────────┤
│                 后端服务层                              │
│   Neo4j数据库      │    PostgreSQL数据库              │
└─────────────────────────────────────────────────────────┘
```

### 数据流向设计
1. **优先Neo4j**: 从Neo4j获取最新知识图谱数据
2. **降级模拟**: Neo4j不可用时回退到模拟数据
3. **缓存策略**: Redis缓存查询结果，提升响应速度
4. **实时同步**: 通过WebSocket推送数据更新

## 具体实现方案

### 步骤 1: 创建Neo4j API服务

#### 1.1 新增API服务模块
创建 `frontend/services/neo4jService.ts`:

```typescript
import { client } from '../api'

// Neo4j数据适配器
export class Neo4jService {
  // 获取产线知识图谱
  static async getLineKnowledgeGraph(lineType: string): Promise<KnowledgeGraph | null> {
    try {
      const response = await client.get('/knowledge-graph/graph/line/' + lineType)
      return response.data
    } catch (error) {
      console.warn('Neo4j unavailable, falling back to mock data')
      return null
    }
  }

  // 获取异常完整分析
  static async getAnomalyAnalysis(sequence: number): Promise<AnomalyAnalysis | null> {
    try {
      const response = await client.get('/knowledge-graph/analysis/anomaly/' + sequence)
      return response.data
    } catch (error) {
      console.warn('Neo4j unavailable, falling back to mock data')
      return null
    }
  }

  // 查找相似异常
  static async findSimilarAnomalies(phenomenon: string): Promise<SimilarAnomaly[]> {
    try {
      const response = await client.post('/knowledge-graph/similarity/anomalies', { phenomenon })
      return response.data
    } catch (error) {
      console.warn('Neo4j unavailable, falling back to mock data')
      return []
    }
  }

  // 推荐解决方案
  static async recommendSolutions(lineType: string, severity?: string): Promise<SolutionRecommendation[]> {
    try {
      const response = await client.get('/knowledge-graph/recommendations/solutions', {
        params: { line_type: lineType, severity }
      })
      return response.data
    } catch (error) {
      console.warn('Neo4j unavailable, falling back to mock data')
      return []
    }
  }

  // 分析产线健康
  static async analyzeLineHealth(lineType: string): Promise<LineHealthAnalysis | null> {
    try {
      const response = await client.get('/knowledge-graph/health/line/' + lineType)
      return response.data
    } catch (error) {
      console.warn('Neo4j unavailable, falling back to mock data')
      return null
    }
  }
}

// 数据类型定义
export interface AnomalyAnalysis {
  sequence: number
  name: string
  phenomenon: string
  severity: string
  line_type: string
  causes: Array<{
    type: string
    description: string
    confidence: number
  }>
  solutions: Array<{
    type: string
    method: string
    priority: number
    success_rate: number
  }>
}

export interface SimilarAnomaly {
  sequence: number
  phenomenon: string
  similarity_score: number
}

export interface SolutionRecommendation {
  method: string
  type: string
  priority: number
  success_rate: number
  cost_level: string
  usage_count: number
}

export interface LineHealthAnalysis {
  line_type: string
  total_anomalies: number
  unique_causes: number
  high_severity_count: number
  high_severity_ratio: number
  health_score: number
}
```

### 步骤 2: 数据适配器模式

#### 2.1 创建统一数据接口
创建 `frontend/services/dataAdapter.ts`:

```typescript
import { Neo4jService } from './neo4jService'
import { getKnowledgeGraphByAnomalyId, getAnomalyById } from '../mockData'
import type { KnowledgeGraph, AnomalyDetail } from '../types'

export class KnowledgeGraphAdapter {
  private static neo4jAvailable = true

  // 检查Neo4j可用性
  static async checkNeo4jAvailability(): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/knowledge-graph/health/line/SMT')
      this.neo4jAvailable = response.ok
      return this.neo4jAvailable
    } catch {
      this.neo4jAvailable = false
      return false
    }
  }

  // 获取知识图谱数据（优先Neo4j，降级模拟）
  static async getKnowledgeGraph(anomalyId: string): Promise<KnowledgeGraph | null> {
    // 尝试从Neo4j获取
    if (this.neo4jAvailable) {
      try {
        // 从anomalyId提取sequence和lineType
        const { sequence, lineType } = this.parseAnomalyId(anomalyId)
        
        // 调用Neo4j API
        const graphData = await Neo4jService.getAnomalyAnalysis(sequence)
        if (graphData) {
          // 转换为前端需要的格式
          return this.transformNeo4jToFrontend(graphData, anomalyId)
        }
      } catch (error) {
        console.warn('Neo4j query failed, falling back to mock data:', error)
        this.neo4jAvailable = false
      }
    }

    // 降级到模拟数据
    return getKnowledgeGraphByAnomalyId(anomalyId)
  }

  // 获取异常详情
  static async getAnomalyDetail(anomalyId: string): Promise<AnomalyDetail | null> {
    // 尝试从Neo4j获取
    if (this.neo4jAvailable) {
      try {
        const { sequence, lineType } = this.parseAnomalyId(anomalyId)
        const analysis = await Neo4jService.getAnomalyAnalysis(sequence)
        
        if (analysis) {
          return this.transformNeo4jAnomalyToFrontend(analysis, anomalyId)
        }
      } catch (error) {
        console.warn('Neo4j anomaly detail failed, falling back to mock data:', error)
      }
    }

    // 降级到模拟数据
    return getAnomalyById(anomalyId)
  }

  // 查找相似异常
  static async findSimilarAnomalies(phenomenon: string): Promise<AnomalyDetail[]> {
    if (this.neo4jAvailable) {
      try {
        const similar = await Neo4jService.findSimilarAnomalies(phenomenon)
        // 转换为前端格式
        return similar.map(item => ({
          id: `similar-${item.sequence}`,
          time: new Date().toLocaleTimeString(),
          level: 'warning' as const,
          location: '相似异常',
          message: item.phenomenon,
          lineType: 'SMT' as const, // 需要从Neo4j获取
          description: item.phenomenon,
          rootCause: '基于相似性分析',
          solutions: []
        }))
      } catch (error) {
        console.warn('Neo4j similarity search failed:', error)
      }
    }

    // 简单的模糊匹配降级方案
    return []
  }

  // 获取智能推荐
  static async getSmartRecommendations(lineType: string): Promise<SolutionOption[]> {
    if (this.neo4jAvailable) {
      try {
        const recommendations = await Neo4jService.recommendSolutions(lineType)
        return recommendations.map(rec => ({
          id: `rec-${Date.now()}`,
          title: `${rec.type}: ${rec.method}`,
          type: rec.priority > 7 ? 'recommended' : 'alternative',
          description: rec.method,
          duration: '15-30 min',
          risk: rec.cost_level === 'LOW' ? 'low' : 'medium'
        }))
      } catch (error) {
        console.warn('Neo4j recommendations failed:', error)
      }
    }

    // 降级方案
    return []
  }

  // 解析异常ID
  private static parseAnomalyId(anomalyId: string): { sequence: number, lineType: string } {
    // 格式: "smt-001", "pcb-003" 等
    const parts = anomalyId.split('-')
    const lineType = parts[0].toUpperCase()
    const sequence = parseInt(parts[1], 10)
    
    return { sequence, lineType }
  }

  // 转换Neo4j数据为前端格式
  private static transformNeo4jToFrontend(neo4jData: any, anomalyId: string): KnowledgeGraph {
    const nodes: KnowledgeNode[] = []
    const edges: KnowledgeEdge[] = []

    // 转换节点
    if (neo4jData.anomaly) {
      nodes.push({
        id: 'phenomenon',
        type: 'phenomenon',
        label: '异常现象',
        description: neo4jData.anomaly.phenomenon
      })
    }

    if (neo4jData.causes) {
      neo4jData.causes.forEach((cause: any, index: number) => {
        nodes.push({
          id: `cause-${index}`,
          type: 'cause',
          label: cause.type,
          description: cause.description
        })

        // 创建连接到解决方案的关系
        if (neo4jData.solutions) {
          neo4jData.solutions.forEach((solution: any, sIndex: number) => {
            nodes.push({
              id: `solution-${sIndex}`,
              type: 'solution',
              label: solution.type,
              description: solution.method
            })

            edges.push({
              id: `edge-${index}-${sIndex}`,
              source: `cause-${index}`,
              target: `solution-${sIndex}`,
              type: 'solved_by'
            })
          })
        }

        // 原因到现象的关系
        edges.push({
          id: `cause-edge-${index}`,
          source: 'phenomenon',
          target: `cause-${index}`,
          type: 'caused_by'
        })
      })
    }

    return {
      nodes,
      edges,
      anomalyId
    }
  }

  // 转换异常详情
  private static transformNeo4jAnomalyToFrontend(neo4jData: any, anomalyId: string): AnomalyDetail {
    return {
      id: anomalyId,
      time: new Date().toLocaleTimeString(),
      level: neo4jData.severity === 'HIGH' ? 'error' : 'warning',
      location: `${neo4jData.line_type}设备`,
      message: neo4jData.phenomenon,
      lineType: neo4jData.line_type,
      description: neo4jData.phenomenon,
      rootCause: neo4jData.causes?.[0]?.description || '未知原因',
      solutions: neo4jData.solutions?.map((s: any) => s.method) || []
    }
  }
}
```

### 步骤 3: 更新KnowledgeGraphPage

#### 3.1 修改数据获取逻辑
更新 `frontend/pages/KnowledgeGraphPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { KnowledgeGraphAdapter } from '../services/dataAdapter'
import { getKnowledgeGraphByAnomalyId } from '../mockData' // 保留作为降级

// 在组件中添加状态
const [dataSource, setDataSource] = useState<'neo4j' | 'mock'>('mock')
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const loadKnowledgeGraph = async () => {
    try {
      setLoading(true)
      setError(null)

      // 首先检查Neo4j可用性
      const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()
      
      let data: KnowledgeGraph | null = null

      if (neo4jAvailable) {
        // 尝试从Neo4j获取数据
        data = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
        setDataSource('neo4j')
      }

      // 如果Neo4j失败或无数据，降级到模拟数据
      if (!data) {
        data = getKnowledgeGraphByAnomalyId(anomalyId)
        setDataSource('mock')
      }

      if (data) {
        setGraphData(data)
        // 设置默认选中节点
        const phenomenonNode = data.nodes.find((node) => node.type === 'phenomenon')
        if (phenomenonNode) {
          setSelectedNode(phenomenonNode)
          setShowDetailPanel(true)
        }
      } else {
        setError('无法加载知识图谱数据')
      }
    } catch (err) {
      console.error('Failed to load knowledge graph:', err)
      setError('数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  loadKnowledgeGraph()
}, [location.search, anomalyId])

// 添加数据源指示器
return (
  <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
    {/* 顶部导航 */}
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex-none z-20 shadow-sm">
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-slate-800">知识图谱</h1>
            <p className="text-xs text-slate-500">异常ID: {graphData?.anomalyId}</p>
          </div>
          
          {/* 数据源指示器 */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              dataSource === 'neo4j' ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            <span className="text-xs text-slate-600">
              {dataSource === 'neo4j' ? '实时数据' : '演示数据'}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-slate-600 hover:text-slate-800 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新数据'}
          </button>
          <button
            onClick={handleBackToDashboard}
            className="text-slate-600 hover:text-slate-800 px-3 py-2 text-sm font-medium transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    </div>

    {/* 错误提示 */}
    {error && (
      <div className="bg-red-50 border-b border-red-200 px-6 py-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={16} />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )}

    {/* 主要内容区域 */}
    <div className="flex-1 relative overflow-hidden">
      {/* 图谱画布 */}
      <div className="absolute inset-0 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-slate-600 text-sm">
                {dataSource === 'neo4j' ? '从知识图谱数据库加载...' : '加载演示数据...'}
              </p>
            </div>
          </div>
        ) : (
          <KnowledgeGraphCanvas
            graphData={graphData}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?.id}
          />
        )}
      </div>

      {/* 节点详情面板 */}
      {showDetailPanel && !loading && (
        <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-32px)] flex flex-col z-10 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
          <div className="bg-white flex-1 overflow-hidden flex flex-col rounded-xl border border-slate-200">
            <div className="absolute top-2 right-2 z-20">
              <button 
                onClick={() => setShowDetailPanel(false)}
                className="p-1 rounded-full bg-white/80 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <NodeDetailPanel selectedNode={selectedNode} />
          </div>
        </div>
      )}
    </div>
  </div>
)
```

### 步骤 4: 更新SinanAnalysis页面

#### 4.1 替换静态可视化
更新 `frontend/pages/SinanAnalysis.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KnowledgeGraphCanvas from '../components/KnowledgeGraphCanvas'
import NodeDetailPanel from '../components/NodeDetailPanel'
import { KnowledgeGraphAdapter } from '../services/dataAdapter'
import { SOLUTIONS } from '../mockData' // 保留现有解决方案数据

const SinanAnalysis: React.FC = () => {
  const navigate = useNavigate()
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'neo4j' | 'mock'>('mock')

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true)
        
        // 加载当前异常的完整知识图谱
        const anomalyId = 'smt-001' // 当前选中的异常ID
        const graph = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
        
        if (graph) {
          setGraphData(graph)
          setDataSource(await KnowledgeGraphAdapter.checkNeo4jAvailability() ? 'neo4j' : 'mock')
          
          // 默认选中第一个节点
          const firstNode = graph.nodes[0]
          setSelectedNode(firstNode)
        }
      } catch (error) {
        console.error('Failed to load analysis data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalysisData()
  }, [])

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)
  }

  const handleGenerateSolution = () => {
    if (graphData && selectedNode) {
      // 传递到天筹决策页面
      navigate('/app/tianchou', {
        state: {
          anomaly: {
            id: graphData.anomalyId,
            phenomenon: selectedNode.description,
            rootCauses: graphData.nodes
              .filter(node => node.type === 'cause')
              .map(node => node.description),
            solutions: graphData.nodes
              .filter(node => node.type === 'solution')
              .map(node => ({
                id: node.id,
                name: node.label,
                description: node.description,
                estimatedTime: '15-30分钟',
                successRate: 85,
                risk: 12
              }))
          },
          knowledgeGraph: graphData
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载AI分析结果...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            司南 · 智能诊断中心
            <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded-full">
              AI Powered
            </span>
            {dataSource === 'neo4j' && (
              <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                实时数据
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            关联工单：WO-20240523-01 | 异常设备：#5 贴片机
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left: Knowledge Graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <GitGraph className="text-indigo-600" />
            <h2 className="font-bold text-lg">格物 · 根因分析</h2>
          </div>

          <div className="flex-1 relative bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
            {graphData ? (
              <KnowledgeGraphCanvas
                graphData={graphData}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNode?.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p>暂无图谱数据</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900 leading-relaxed">
            <span className="font-bold">AI 分析总结：</span>
            {dataSource === 'neo4j' 
              ? '基于实时知识图谱数据，结合设备运行日志与震动传感器数据，系统排除了"物料尺寸"问题。当前真空度曲线呈现周期性泄露特征，92%概率指向吸嘴老化磨损。'
              : '演示模式：结合设备运行日志（Log-302）与震动传感器数据，系统排除了"物料尺寸"问题。当前真空度曲线呈现周期性泄露特征，92%概率指向吸嘴老化磨损。'
            }
          </div>
        </div>

        {/* Right: Solutions and Node Details */}
        <div className="flex flex-col gap-6">
          {/* Node Details */}
          {selectedNode && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <Info className="text-blue-600" />
                <h3 className="font-bold text-lg">节点详情</h3>
              </div>
              <NodeDetailPanel selectedNode={selectedNode} />
            </div>
          )}

          {/* Solutions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <Zap className="text-amber-500" />
              <h2 className="font-bold text-lg">天筹 · 决策优化</h2>
            </div>

            <div className="space-y-4">
              {SOLUTIONS.map((sol) => (
                <div
                  key={sol.id}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    sol.type === 'recommended'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {sol.type === 'recommended' && (
                    <div className="absolute -top-3 left-6 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                      AI 推荐
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">{sol.title}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={16} /> {sol.duration}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          sol.risk === 'low' ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        <ShieldAlert size={16} /> {sol.risk === 'low' ? '低风险' : '中风险'}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 mb-6">{sol.description}</p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                        sol.type === 'recommended'
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {sol.type === 'recommended' ? '采纳并执行' : '选择此方案'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upsell Hook */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white flex items-center justify-between shadow-lg mt-6">
        <div>
          <h3 className="font-bold mb-1">解锁更多高级算法</h3>
          <p className="text-sm text-slate-400">
            当前仅启用了基础诊断，升级以获得"预测性维护"功能
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors"
        >
          前往能力商店
        </button>
      </div>
    </div>
  )
}
```

### 步骤 5: 添加缓存和性能优化

#### 5.1 实现缓存策略
创建 `frontend/services/cacheService.ts`:

```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5分钟

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // 缓存知识图谱数据
  setKnowledgeGraph(anomalyId: string, data: KnowledgeGraph): void {
    this.set(`knowledge-graph:${anomalyId}`, data)
  }

  getKnowledgeGraph(anomalyId: string): KnowledgeGraph | null {
    return this.get(`knowledge-graph:${anomalyId}`)
  }

  // 缓存异常分析数据
  setAnomalyAnalysis(sequence: number, data: AnomalyAnalysis): void {
    this.set(`anomaly-analysis:${sequence}`, data)
  }

  getAnomalyAnalysis(sequence: number): AnomalyAnalysis | null {
    return this.get(`anomaly-analysis:${sequence}`)
  }

  // 缓存相似异常数据
  setSimilarAnomalies(phenomenon: string, data: SimilarAnomaly[]): void {
    this.set(`similar-anomalies:${phenomenon}`, data, 10 * 60 * 1000) // 10分钟
  }

  getSimilarAnomalies(phenomenon: string): SimilarAnomaly[] | null {
    return this.get(`similar-anomalies:${phenomenon}`)
  }
}

export const cacheService = new CacheService()
```

#### 5.2 更新数据适配器使用缓存
```typescript
// 在KnowledgeGraphAdapter中使用缓存
import { cacheService } from './cacheService'

static async getKnowledgeGraph(anomalyId: string): Promise<KnowledgeGraph | null> {
  // 先检查缓存
  const cached = cacheService.getKnowledgeGraph(anomalyId)
  if (cached) {
    return cached
  }

  // 从数据源获取
  let data: KnowledgeGraph | null = null
  
  if (this.neo4jAvailable) {
    try {
      const { sequence } = this.parseAnomalyId(anomalyId)
      const analysis = await Neo4jService.getAnomalyAnalysis(sequence)
      if (analysis) {
        data = this.transformNeo4jToFrontend(analysis, anomalyId)
      }
    } catch (error) {
      console.warn('Neo4j query failed:', error)
      this.neo4jAvailable = false
    }
  }

  if (!data) {
    data = getKnowledgeGraphByAnomalyId(anomalyId)
  }

  // 缓存结果
  if (data) {
    cacheService.setKnowledgeGraph(anomalyId, data)
  }

  return data
}
```

### 步骤 6: 添加实时数据同步

#### 6.1 WebSocket连接
创建 `frontend/services/websocketService.ts`:

```typescript
class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private listeners = new Map<string, Set<Function>>()

  connect(url: string = 'ws://localhost:8000/ws/knowledge-graph'): void {
    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('Knowledge Graph WebSocket connected')
        this.reconnectAttempts = 0
        this.emit('connected', {})
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit(data.type, data.payload)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('Knowledge Graph WebSocket disconnected')
        this.emit('disconnected', {})
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('Knowledge Graph WebSocket error:', error)
        this.emit('error', { error })
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval * this.reconnectAttempts)
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  // 订阅知识图谱更新
  subscribeToKnowledgeGraph(anomalyId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'knowledge-graph',
        anomalyId
      }))
    }
  }

  // 取消订阅
  unsubscribeFromKnowledgeGraph(anomalyId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel: 'knowledge-graph',
        anomalyId
      }))
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const wsService = new WebSocketService()
```

### 步骤 7: 环境配置和部署

#### 7.1 环境变量配置
更新 `frontend/.env.local`:

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000

# Neo4j配置（开发环境）
VITE_NEO4J_ENABLED=true
VITE_NEO4J_BROWSER_URL=http://localhost:7474

# WebSocket配置
VITE_WS_URL=ws://localhost:8000/ws/knowledge-graph

# 缓存配置
VITE_CACHE_TTL=300000

# Gemini API Key（可选）
VITE_GEMINI_API_KEY=your_gemini_api_key
```

#### 7.2 配置API客户端
更新 `frontend/api.ts`:

```typescript
import { createClient } from './src/client'

// 创建客户端实例
const client = createClient()

// 配置客户端
client.setConfig({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 设置认证token
client.interceptors.request.use((request) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
})

// Neo4j可用性检查
export const checkNeo4jAvailability = async (): Promise<boolean> => {
  try {
    const response = await client.get('/knowledge-graph/health/line/SMT')
    return response.status === 200
  } catch {
    return false
  }
}

// 导出客户端
export { client }
```

### 步骤 8: 错误处理和降级策略

#### 8.1 完善的错误处理
创建 `frontend/hooks/useKnowledgeGraph.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { KnowledgeGraphAdapter } from '../services/dataAdapter'
import { wsService } from '../services/websocketService'
import type { KnowledgeGraph, KnowledgeNode, AnomalyDetail } from '../types'

interface UseKnowledgeGraphReturn {
  graphData: KnowledgeGraph | null
  selectedNode: KnowledgeNode | null
  loading: boolean
  error: string | null
  dataSource: 'neo4j' | 'mock' | null
  refetch: () => Promise<void>
  setSelectedNode: (node: KnowledgeNode | null) => void
}

export const useKnowledgeGraph = (anomalyId: string): UseKnowledgeGraphReturn => {
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'neo4j' | 'mock' | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
      
      if (data) {
        setGraphData(data)
        setDataSource(await KnowledgeGraphAdapter.checkNeo4jAvailability() ? 'neo4j' : 'mock')
        
        // 默认选中现象节点
        const phenomenonNode = data.nodes.find(node => node.type === 'phenomenon')
        if (phenomenonNode) {
          setSelectedNode(phenomenonNode)
        }
      } else {
        setError('无法加载知识图谱数据')
      }
    } catch (err) {
      console.error('Failed to fetch knowledge graph:', err)
      setError('数据加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [anomalyId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // WebSocket实时更新
  useEffect(() => {
    if (dataSource === 'neo4j') {
      wsService.connect()
      wsService.subscribeToKnowledgeGraph(anomalyId)

      wsService.on('knowledge-graph-updated', (payload) => {
        if (payload.anomalyId === anomalyId) {
          fetchData()
        }
      })

      return () => {
        wsService.unsubscribeFromKnowledgeGraph(anomalyId)
      }
    }
  }, [dataSource, anomalyId, fetchData])

  return {
    graphData,
    selectedNode,
    loading,
    error,
    dataSource,
    refetch: fetchData,
    setSelectedNode
  }
}
```

## 部署和配置

### 1. Docker配置更新
更新 `docker-compose.yml` 添加Neo4j服务（已在后端方案中提供）

### 2. 前端环境配置
```bash
# 启动开发环境
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 3. API端点测试
```bash
# 测试Neo4j连接
curl -X GET "http://localhost:8000/api/v1/knowledge-graph/health/line/SMT"

# 获取知识图谱数据
curl -X GET "http://localhost:8000/api/v1/knowledge-graph/graph/line/SMT"

# 获取异常分析
curl -X GET "http://localhost:8000/api/v1/knowledge-graph/analysis/anomaly/1"
```

## 性能优化策略

### 1. 缓存策略
- **内存缓存**: 5分钟TTL的热点数据缓存
- **Redis缓存**: 跨会话的知识图谱数据缓存
- **浏览器缓存**: 静态资源和配置数据缓存

### 2. 懒加载
- **按需加载**: 节点详情按需获取
- **虚拟滚动**: 大量节点时的性能优化
- **分页加载**: 相似异常列表分页展示

### 3. 网络优化
- **请求合并**: 批量获取相关数据
- **增量更新**: 仅更新变化的数据
- **预加载**: 预测用户行为预加载数据

## 监控和调试

### 1. 数据源监控
- **实时状态指示器**: 显示当前数据源（Neo4j/模拟）
- **性能指标**: 响应时间、缓存命中率
- **错误统计**: 数据源切换频率和错误率

### 2. 调试工具
- **数据源切换**: 开发环境下的强制数据源选择
- **缓存清理**: 一键清理所有缓存数据
- **网络监控**: API请求和响应时间监控

## 预期效果

### 1. 用户体验提升
- **无缝切换**: 用户无感知的数据源切换
- **实时更新**: 基于Neo4j的实时知识图谱更新
- **丰富交互**: 完整的节点交互和详情展示

### 2. 系统能力增强
- **智能推荐**: 基于知识图谱的解决方案推荐
- **相似性分析**: 自动发现相似的历史异常
- **根因追踪**: 完整的因果关系链路展示

### 3. 运维效率提升
- **可视化诊断**: 直观的异常传播路径
- **预防性维护**: 基于历史模式的预警
- **知识复用**: 快速复用历史解决方案

## 总结

这个集成方案实现了：

1. **无缝集成**: 前端现有功能完全兼容，Neo4j作为增强
2. **智能降级**: 完善的数据源切换和错误处理机制
3. **性能优化**: 多层缓存和实时同步机制
4. **用户体验**: 保持现有交互习惯的同时增强功能

通过这个方案，前端可以充分利用现有的成熟可视化组件，同时获得Neo4j提供的强大知识图谱能力，为用户提供更加智能和准确的异常诊断体验。