import { knowledgeGraphApi } from '../src/api/knowledgeGraphApi'

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

export interface KnowledgeGraphResponse {
  nodes: Array<{
    id: string
    type: 'phenomenon' | 'cause' | 'solution'
    label: string
    description: string
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: 'leads_to' | 'caused_by' | 'solved_by'
    label?: string
  }>
  anomalyId: string
}

// Neo4j数据适配器
export class Neo4jService {
  // 获取产线知识图谱
  static async getLineKnowledgeGraph(lineType: string): Promise<KnowledgeGraphResponse | null> {
    try {
      // 注意：这个端点可能需要额外的处理，因为返回格式可能不同
      const healthData = await knowledgeGraphApi.checkLineHealth(lineType)
      // 这里可以根据需要转换数据格式
      console.log('产线知识图谱数据:', healthData)
      return null // 暂时返回null，因为数据格式需要进一步处理
    } catch (error) {
      console.warn('Neo4j getLineKnowledgeGraph unavailable, falling back to mock data', error)
      return null
    }
  }

  // 获取异常完整分析
  static async getAnomalyAnalysis(sequence: number): Promise<AnomalyAnalysis | null> {
    try {
      console.log(`发送请求获取异常分析，序列号: ${sequence}`)
      const data = await knowledgeGraphApi.getAnomalyAnalysis(sequence)
      console.log(`成功获取异常分析数据，序列号: ${sequence}`)
      return data
    } catch (error) {
      console.error(`获取异常分析失败，序列号: ${sequence}`, error)
      return null
    }
  }

  // 查找相似异常
  static async findSimilarAnomalies(phenomenon: string): Promise<SimilarAnomaly[]> {
    try {
      const data = await knowledgeGraphApi.findSimilarAnomalies(phenomenon)
      return data
    } catch (error) {
      console.warn('Neo4j findSimilarAnomalies unavailable, falling back to mock data', error)
      return []
    }
  }

  // 推荐解决方案
  static async recommendSolutions(
    lineType: string,
    severity?: string
  ): Promise<SolutionRecommendation[]> {
    try {
      const data = await knowledgeGraphApi.recommendSolutions(lineType, severity)
      return data
    } catch (error) {
      console.warn('Neo4j recommendSolutions unavailable, falling back to mock data', error)
      return []
    }
  }

  // 分析产线健康
  static async analyzeLineHealth(lineType: string): Promise<LineHealthAnalysis | null> {
    try {
      const data = await knowledgeGraphApi.checkLineHealth(lineType)
      return data
    } catch (error) {
      console.warn('Neo4j analyzeLineHealth unavailable, falling back to mock data', error)
      return null
    }
  }

  // 检查 Neo4j 服务可用性
  static async checkAvailability(): Promise<boolean> {
    try {
      console.log('发送健康检查请求到Neo4j服务...')
      const data = await knowledgeGraphApi.checkLineHealth('SMT')
      const isAvailable = !!data && typeof data === 'object'
      console.log(`Neo4j服务健康检查结果: ${isAvailable}`)
      return isAvailable
    } catch (error) {
      console.warn('Neo4j service is not available', error)
      return false
    }
  }

  // 获取所有异常数据
  static async getAllAnomalies(): Promise<any[]> {
    try {
      console.log('发送请求获取所有异常数据...')
      const data = await knowledgeGraphApi.getAllAnomalies()
      console.log(`成功获取所有异常数据，共 ${data.length} 条记录`)
      return data
    } catch (error) {
      console.error('获取所有异常数据失败:', error)
      throw error
    }
  }
}
