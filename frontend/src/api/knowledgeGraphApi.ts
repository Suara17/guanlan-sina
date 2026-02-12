import axios from 'axios';

// 知识图谱相关的数据类型定义
export interface AnomalyAnalysis {
  sequence: number;
  name: string;
  phenomenon: string;
  severity: string;
  line_type: string;
  causes: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  solutions: Array<{
    type: string;
    method: string;
    priority: number;
    success_rate: number;
  }>;
}

export interface SimilarAnomaly {
  sequence: number;
  phenomenon: string;
  similarity_score: number;
}

export interface SolutionRecommendation {
  method: string;
  type: string;
  priority: number;
  success_rate: number;
  cost_level: string;
  usage_count: number;
}

export interface LineHealthAnalysis {
  line_type: string;
  total_anomalies: number;
  unique_causes: number;
  high_severity_count: number;
  high_severity_ratio: number;
  health_score: number;
}

export interface AllAnomalyItem {
  sequence: number;
  name: string;
  phenomenon: string;
  severity: string;
  line_type: string;
  causes: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  solutions: Array<{
    type: string;
    method: string;
    priority: number;
    success_rate: number;
  }>;
}

// 知识图谱API客户端 - 使用相对路径，通过Vite代理访问后端
const API_BASE_URL = ''; // 空字符串使请求走相对路径 (/api/...)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 知识图谱API方法
export const knowledgeGraphApi = {
  // 检查产线健康状况
  async checkLineHealth(lineType: string): Promise<LineHealthAnalysis> {
    try {
      const response = await apiClient.get(`/api/v1/knowledge-graph/health/line/${lineType}`);
      return response.data;
    } catch (error) {
      console.error('Error checking line health:', error);
      throw error;
    }
  },

  // 获取异常完整分析
  async getAnomalyAnalysis(sequence: number): Promise<AnomalyAnalysis> {
    try {
      const response = await apiClient.get(`/api/v1/knowledge-graph/analysis/anomaly/${sequence}`);
      return response.data;
    } catch (error) {
      console.error('Error getting anomaly analysis:', error);
      throw error;
    }
  },

  // 查找相似异常
  async findSimilarAnomalies(phenomenon: string, limit: number = 10): Promise<SimilarAnomaly[]> {
    try {
      const response = await apiClient.post(`/api/v1/knowledge-graph/similarity/anomalies`, {
        phenomenon,
        limit
      });
      return response.data;
    } catch (error) {
      console.error('Error finding similar anomalies:', error);
      throw error;
    }
  },

  // 推荐解决方案
  async recommendSolutions(
    lineType: string, 
    severity?: string
  ): Promise<SolutionRecommendation[]> {
    try {
      const params = severity ? { line_type: lineType, severity } : { line_type: lineType };
      const response = await apiClient.get('/api/v1/knowledge-graph/recommendations/solutions', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error recommending solutions:', error);
      throw error;
    }
  },

  // 获取解决方案统计
  async getSolutionStatistics() {
    try {
      const response = await apiClient.get('/api/v1/knowledge-graph/statistics/solutions');
      return response.data;
    } catch (error) {
      console.error('Error getting solution statistics:', error);
      throw error;
    }
  },

  // 获取根本原因分析
  async getRootCauseAnalysis(lineType: string, limit: number = 10) {
    try {
      const response = await apiClient.get(
        `/api/v1/knowledge-graph/analysis/root-causes/${lineType}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting root cause analysis:', error);
      throw error;
    }
  },

  // 获取所有异常列表（用于知识图谱全景展示）
  async getAllAnomalies(): Promise<AllAnomalyItem[]> {
    try {
      const response = await apiClient.get('/api/v1/knowledge-graph/analysis/all-anomalies');
      return response.data;
    } catch (error) {
      console.error('Error getting all anomalies:', error);
      throw error;
    }
  }
};