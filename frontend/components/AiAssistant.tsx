import axios from 'axios'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Network,
  Radar,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { type KnowledgeQaCitation, knowledgeQaApi } from '../src/api/knowledgeQaApi'

interface CitationCard {
  id: string
  sourceType: 'graph' | 'document'
  title: string
  snippet: string
  score?: number | null
  retriever: 'graph' | 'keyword' | 'vector' | 'document'
  metadata: Record<string, unknown>
}

interface AssistantMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  citations?: CitationCard[]
  warnings?: string[]
}

interface AiAssistantProps {
  open: boolean
  onClose: () => void
  contextData: Record<string, unknown>
  entrySource?: string
  draftQuestion?: string | null
}

const QUICK_QUESTIONS = [
  '当前异常的主要原因是什么？',
  '给我这条问题的处理步骤',
  '有没有相关 SOP 或手册依据？',
]

const getWelcomeMessage = (entrySource?: string) => {
  const sourceLabel =
    entrySource === 'dashboard'
      ? '生产看板'
      : entrySource === 'sinan'
        ? '司南诊断'
        : entrySource === 'gewu'
          ? '格物图谱'
          : entrySource === 'kernel'
            ? '内核接入'
            : '当前页面'

  return `您好，我是司南。可以继续围绕${sourceLabel}提问，我会优先结合知识图谱事实与文档依据回答。`
}

const buildFallbackMessage = (question: string, detail?: string): AssistantMessage => ({
  id: `ai-fallback-${Date.now()}`,
  role: 'ai',
  content: `暂时无法完成“${question}”的知识检索，请稍后重试。`,
  warnings: [detail || '知识问答服务暂不可用。'],
})

const mapCitation = (citation: KnowledgeQaCitation, index: number): CitationCard => ({
  id: `${citation.source_type}-${index}-${citation.title}`,
  sourceType: citation.source_type,
  title: citation.title,
  snippet: citation.snippet,
  score: citation.score,
  retriever:
    typeof citation.metadata?.retriever === 'string' &&
    ['graph', 'keyword', 'vector', 'document'].includes(citation.metadata.retriever)
      ? (citation.metadata.retriever as CitationCard['retriever'])
      : citation.source_type === 'graph'
        ? 'graph'
        : 'document',
  metadata: citation.metadata,
})

const getLineType = (contextData: Record<string, unknown>): string | undefined => {
  if (typeof contextData.lineType === 'string') return contextData.lineType
  if (typeof contextData.line_type === 'string') return contextData.line_type
  return undefined
}

const getSequence = (contextData: Record<string, unknown>): number | undefined => {
  if (typeof contextData.sequence === 'number') return contextData.sequence
  if (typeof contextData.anomalyId === 'number') return contextData.anomalyId
  if (typeof contextData.anomalyId === 'string') {
    const matched = contextData.anomalyId.match(/\d+/)
    if (matched) return Number(matched[0])
  }
  return undefined
}

const AiAssistant: React.FC<AiAssistantProps> = ({
  open,
  onClose,
  contextData,
  entrySource,
  draftQuestion,
}) => {
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMessages([
      {
        id: `welcome-${entrySource || 'global'}`,
        role: 'ai',
        content: getWelcomeMessage(entrySource),
      },
    ])
  }, [entrySource])

  useEffect(() => {
    if (!open || !draftQuestion) return
    setInputValue(draftQuestion)
  }, [open, draftQuestion])

  const contextSummary = useMemo(() => {
    const items: string[] = []
    if (typeof contextData.page === 'string') items.push(`页面: ${contextData.page}`)
    if (typeof contextData.lineType === 'string') items.push(`产线: ${contextData.lineType}`)
    if (typeof contextData.line_type === 'string') items.push(`产线: ${contextData.line_type}`)
    if (typeof contextData.anomalyId === 'string') items.push(`异常: ${contextData.anomalyId}`)
    if (typeof contextData.sequence === 'number') items.push(`序号: ${contextData.sequence}`)
    if (typeof contextData.selectedNodeLabel === 'string') {
      items.push(`节点: ${contextData.selectedNodeLabel}`)
    }
    return items.slice(0, 3)
  }, [contextData])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  const handleSend = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setLoading(true)
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    try {
      const response = await knowledgeQaApi.ask({
        question: trimmed,
        line_type: getLineType(contextData),
        sequence: getSequence(contextData),
        top_k: 5,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: response.answer,
          citations: response.citations.map(mapCitation),
          warnings: response.warnings,
        },
      ])
    } catch (error) {
      let detail = '知识问答服务暂不可用。'
      if (axios.isAxiosError(error)) {
        detail =
          typeof error.response?.data?.detail === 'string'
            ? error.response.data.detail
            : error.message
      } else if (error instanceof Error) {
        detail = error.message
      }

      setMessages((prev) => [...prev, buildFallbackMessage(trimmed, detail)])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-y-6 right-6 z-[70] w-[24rem] max-w-[calc(100vw-1.5rem)]">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-2xl shadow-slate-900/20">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-semibold">司南 · 知识问答</span>
              </div>
              <p className="mt-1 text-xs text-blue-100">
                优先结合知识图谱事实与文档依据回答当前问题
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-white/90 hover:bg-white/15"
            >
              <X size={16} />
            </button>
          </div>

          {contextSummary.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {contextSummary.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] text-white"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-tr-none bg-blue-600 text-white'
                    : 'rounded-tl-none border border-slate-100 bg-white text-slate-700 shadow-sm'
                }`}
              >
                <p>{msg.content}</p>
                {msg.warnings && msg.warnings.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.warnings.map((warning) => (
                      <div
                        key={`${msg.id}-${warning}`}
                        className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
                      >
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {[
                      {
                        key: 'graph',
                        title: '图谱事实',
                        icon: Network,
                        iconClass: 'text-blue-500',
                        items: msg.citations.filter((citation) => citation.retriever === 'graph'),
                      },
                      {
                        key: 'keyword',
                        title: '关键词补充',
                        icon: Search,
                        iconClass: 'text-amber-500',
                        items: msg.citations.filter((citation) => citation.retriever === 'keyword'),
                      },
                      {
                        key: 'vector',
                        title: '向量召回',
                        icon: Radar,
                        iconClass: 'text-cyan-500',
                        items: msg.citations.filter((citation) => citation.retriever === 'vector'),
                      },
                      {
                        key: 'document',
                        title: '其他文本',
                        icon: FileText,
                        iconClass: 'text-slate-500',
                        items: msg.citations.filter(
                          (citation) => citation.retriever === 'document'
                        ),
                      },
                    ]
                      .filter((group) => group.items.length > 0)
                      .map((group) => {
                        const groupKey = `${msg.id}-${group.key}`
                        const isExpanded = expandedGroups[groupKey] ?? group.key === 'graph'
                        const Icon = group.icon
                        const visibleItems = isExpanded ? group.items : group.items.slice(0, 1)

                        return (
                          <div
                            key={groupKey}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <button
                              type="button"
                              onClick={() => toggleGroup(groupKey)}
                              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              <span className="flex items-center gap-2">
                                <Icon size={12} className={group.iconClass} />
                                <span>{group.title}</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">
                                  {group.items.length}
                                </span>
                              </span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            <div className="space-y-2 border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
                              {visibleItems.map((citation) => (
                                <div
                                  key={citation.id}
                                  className="rounded-lg border border-white bg-white px-3 py-2"
                                >
                                  <div className="mb-1 flex flex-wrap items-center gap-1 font-medium text-slate-700">
                                    <span>{citation.title}</span>
                                    {typeof citation.metadata.sequence === 'number' && (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                        序号 {citation.metadata.sequence}
                                      </span>
                                    )}
                                    {typeof citation.metadata.line_type === 'string' && (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                        {citation.metadata.line_type}
                                      </span>
                                    )}
                                  </div>
                                  <p>{citation.snippet}</p>
                                  {typeof citation.score === 'number' && (
                                    <p className="mt-2 text-[11px] text-slate-400">
                                      匹配度 {citation.score.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {!isExpanded && group.items.length > 1 && (
                                <p className="text-[11px] text-slate-400">
                                  还有 {group.items.length - 1} 条，展开后查看
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex gap-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:120ms]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:240ms]"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void handleSend(item)}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="请输入你的问题，例如：这个异常的处理步骤是什么？"
              className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              rows={2}
            />
            <button
              type="button"
              onClick={() => void handleSend(inputValue)}
              disabled={loading || !inputValue.trim()}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiAssistant
