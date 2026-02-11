import { Neo4jService, type AnomalyAnalysis } from './neo4jService'
import { getKnowledgeGraphByAnomalyId, getAnomalyById } from '../mockData'
import type { KnowledgeGraph, KnowledgeNode, AnomalyDetail } from '../types'

export class KnowledgeGraphAdapter {
  private static neo4jAvailable = true

  // 检查Neo4j可用性
  static async checkNeo4jAvailability(): Promise<boolean> {
    try {
      console.log('检查Neo4j服务可用性...');
      this.neo4jAvailable = await Neo4jService.checkAvailability()
      console.log(`Neo4j服务可用性: ${this.neo4jAvailable}`);
      return this.neo4jAvailable
    } catch (error) {
      console.error('检查Neo4j可用性时发生错误:', error);
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

        console.log(`尝试从Neo4j获取异常数据，序列号: ${sequence}`);

        // 调用Neo4j API
        const graphData = await Neo4jService.getAnomalyAnalysis(sequence)
        if (graphData) {
          console.log(`成功从Neo4j获取异常数据，序列号: ${sequence}`);
          // 转换为前端需要的格式
          return this.transformNeo4jToFrontend(graphData, anomalyId)
        } else {
          console.warn(`Neo4j中未找到序列号为 ${sequence} 的异常数据`);
        }
      } catch (error) {
        console.warn('Neo4j query failed, falling back to mock data:', error)
        this.neo4jAvailable = false
      }
    }

    console.log(`降级到模拟数据，异常ID: ${anomalyId}`);
    // 降级到模拟数据
    return getKnowledgeGraphByAnomalyId(anomalyId)
  }

  // 获取异常详情
  static async getAnomalyDetail(anomalyId: string): Promise<AnomalyDetail | null> {
    // 尝试从Neo4j获取
    if (this.neo4jAvailable) {
      try {
        const { sequence } = this.parseAnomalyId(anomalyId)
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
          lineType: 'SMT' as const,
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
  static async getSmartRecommendations(lineType: string): Promise<any[]> {
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

  // 获取所有异常数据（用于知识图谱全景展示）
  static async getAllAnomalies(): Promise<any[]> {
    if (this.neo4jAvailable) {
      try {
        const anomalies = await Neo4jService.getAllAnomalies()
        return anomalies
      } catch (error) {
        console.warn('Neo4j get all anomalies failed:', error)
        
        // 如果all-anomalies端点不可用，尝试通过已知的异常ID范围获取数据
        try {
          console.log('尝试通过已知异常ID范围获取数据...')
          const allAnomalies = [];
          
          // 假设异常ID范围在1-20之间，可根据实际情况调整
          for (let i = 1; i <= 20; i++) {
            try {
              const anomaly = await Neo4jService.getAnomalyAnalysis(i.toString());
              if (anomaly) {
                allAnomalies.push({
                  sequence: anomaly.sequence,
                  name: anomaly.name,
                  phenomenon: anomaly.phenomenon,
                  severity: anomaly.severity,
                  line_type: anomaly.line_type,
                  causes: anomaly.causes || [],
                  solutions: anomaly.solutions || []
                });
              }
            } catch (innerError) {
              // 如果某个ID不存在，继续下一个
              continue;
            }
          }
          
          if (allAnomalies.length > 0) {
            console.log(`通过ID范围获取到 ${allAnomalies.length} 个异常数据`)
            return allAnomalies;
          }
        } catch (rangeError) {
          console.warn('通过ID范围获取异常数据也失败:', rangeError)
        }
      }
    }

    // 降级到模拟数据
    return []
  }

  // 解析异常ID
  private static parseAnomalyId(anomalyId: string): { sequence: number; lineType: string } {
    // 格式: "smt-001", "pcb-003" 等，或者纯数字
    let sequence: number;
    let lineType: string;

    if (anomalyId.includes('-')) {
      // 格式: "smt-001", "pcb-003" 等
      const parts = anomalyId.split('-');
      lineType = parts[0].toUpperCase();
      sequence = parseInt(parts[1], 10);
    } else {
      // 纯数字格式，直接作为序列号
      sequence = parseInt(anomalyId, 10);
      lineType = 'UNKNOWN'; // 默认值，实际lineType会在查询后确定
    }

    return { sequence, lineType };
  }

  // 转换Neo4j数据为前端格式
  private static transformNeo4jToFrontend(neo4jData: AnomalyAnalysis, anomalyId: string): KnowledgeGraph {
    const nodes: KnowledgeNode[] = []
    const edges: Array<{
      id: string
      source: string
      target: string
      type: 'leads_to' | 'caused_by' | 'solved_by'
      label?: string
    }> = []

    // 1. 创建现象节点
    nodes.push({
      id: 'phenomenon',
      type: 'phenomenon',
      label: '异常现象',
      description: neo4jData.phenomenon
    })

    // 2. 创建原因节点
    const causeNodeIds: string[] = []
    if (neo4jData.causes && neo4jData.causes.length > 0) {
      neo4jData.causes.forEach((cause, index) => {
        const causeId = `cause-${index}`
        causeNodeIds.push(causeId)

        nodes.push({
          id: causeId,
          type: 'cause',
          label: cause.type,
          description: `${cause.description} (置信度: ${(cause.confidence * 100).toFixed(0)}%)`
        })

        // 现象到原因的关系
        edges.push({
          id: `edge-phenomenon-${causeId}`,
          source: 'phenomenon',
          target: causeId,
          type: 'caused_by',
          label: '导致'
        })
      })
    }

    // 3. 创建解决方案节点
    if (neo4jData.solutions && neo4jData.solutions.length > 0) {
      neo4jData.solutions.forEach((solution, sIndex) => {
        const solutionId = `solution-${sIndex}`

        nodes.push({
          id: solutionId,
          type: 'solution',
          label: solution.type,
          description: `${solution.method} (优先级: ${solution.priority}, 成功率: ${(solution.success_rate * 100).toFixed(0)}%)`
        })

        // 每个原因都可能有多个解决方案，建立连接
        if (causeNodeIds.length > 0) {
          // 将解决方案连接到最相关的原因（这里简化为第一个原因）
          const targetCause = causeNodeIds[sIndex % causeNodeIds.length]
          edges.push({
            id: `edge-${targetCause}-${solutionId}`,
            source: targetCause,
            target: solutionId,
            type: 'solved_by',
            label: '解决'
          })
        }
      })
    }

    return {
      nodes,
      edges,
      anomalyId
    }
  }

  // 转换异常详情
  private static transformNeo4jAnomalyToFrontend(neo4jData: AnomalyAnalysis, anomalyId: string): AnomalyDetail {
    return {
      id: anomalyId,
      time: new Date().toLocaleTimeString(),
      level: neo4jData.severity === 'HIGH' ? 'error' : 'warning',
      location: `${neo4jData.line_type}设备`,
      message: neo4jData.phenomenon,
      lineType: neo4jData.line_type as 'SMT' | 'PCB' | '3C',
      description: neo4jData.phenomenon,
      rootCause: neo4jData.causes?.[0]?.description || '未知原因',
      solutions: neo4jData.solutions?.map((s) => s.method) || []
    }
  }
}
