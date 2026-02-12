import type { KnowledgeGraph } from '../types'
import type { AnomalyAnalysis, SimilarAnomaly } from './neo4jService'

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
      expiry: ttl,
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

  // 获取缓存统计信息
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const cacheService = new CacheService()
