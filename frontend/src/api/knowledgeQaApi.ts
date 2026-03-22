import axios from 'axios'

export interface KnowledgeQaRequest {
  question: string
  line_type?: string
  sequence?: number
  top_k?: number
}

export interface KnowledgeQaCitation {
  source_type: 'graph' | 'document'
  title: string
  snippet: string
  score?: number | null
  metadata: Record<string, unknown>
}

export interface KnowledgeQaRouteDecision {
  mode: 'graph' | 'document' | 'hybrid'
  reasons: string[]
}

export interface KnowledgeQaResponse {
  answer: string
  route: KnowledgeQaRouteDecision
  citations: KnowledgeQaCitation[]
  warnings: string[]
  graph_hits: Array<Record<string, unknown>>
  document_hits: Array<Record<string, unknown>>
}

const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Knowledge QA API Error:', error)
    return Promise.reject(error)
  }
)

export const knowledgeQaApi = {
  async ask(payload: KnowledgeQaRequest): Promise<KnowledgeQaResponse> {
    const response = await apiClient.post('/api/v1/knowledge-qa/ask', payload)
    return response.data
  },
}
