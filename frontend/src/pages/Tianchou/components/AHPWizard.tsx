/**
 * AHP权重设定向导组件
 */

import { useState } from 'react'
import { tianchouService } from '../services/tianchouService'
import type { AHPWeights } from '../types/tianchou'

interface Props {
  taskId: string
  onComplete: (weights: AHPWeights) => void
  onClose: () => void
}

export function AHPWizard({ taskId, onComplete, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [matrix, setMatrix] = useState({ m01: '1', m02: '1', m12: '1' })
  const [result, setResult] = useState<{
    weights: AHPWeights
    consistency_ratio: number
    is_valid: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseValue = (v: string): number => {
    if (v.includes('/')) {
      const [a, b] = v.split('/')
      return Number.parseFloat(a) / Number.parseFloat(b)
    }
    return Number.parseFloat(v)
  }

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await tianchouService.calculateAHP(taskId, {
        matrix_01: parseValue(matrix.m01),
        matrix_02: parseValue(matrix.m02),
        matrix_12: parseValue(matrix.m12),
      })
      setResult(res)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">AHP权重设定向导</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {idx < 2 && (
                  <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* 步骤1: 说明 */}
          {step === 1 && (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">欢迎使用AHP权重设定</h3>
              <p className="text-gray-600 mb-6">
                层次分析法(AHP)帮助您量化决策偏好。请比较以下三要素的重要性:
              </p>
              <div className="grid grid-cols-3 gap-4 text-left bg-gray-50 p-4 rounded-lg mb-6">
                <div>
                  <span className="font-medium">💰 成本</span>
                  <p className="text-sm text-gray-500">方案的实施总成本</p>
                </div>
                <div>
                  <span className="font-medium">⏱️ 工期</span>
                  <p className="text-sm text-gray-500">方案的实施周期</p>
                </div>
                <div>
                  <span className="font-medium">📈 收益</span>
                  <p className="text-sm text-gray-500">方案的预期年收益</p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                开始设定
              </button>
            </div>
          )}

          {/* 步骤2: 两两比较 */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-6">请进行两两比较</h3>

              <div className="space-y-6">
                {/* 问题1 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-3">
                    相比于<span className="font-medium">工期</span>，
                    <span className="font-medium">成本</span>有多重要？
                  </p>
                  <select
                    value={matrix.m01}
                    onChange={(e) => setMatrix({ ...matrix, m01: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">同等重要 (1)</option>
                    <option value="3">稍微重要 (3)</option>
                    <option value="5">明显重要 (5)</option>
                    <option value="7">非常重要 (7)</option>
                    <option value="9">极端重要 (9)</option>
                    <option value="1/3">稍微不重要 (1/3)</option>
                    <option value="1/5">明显不重要 (1/5)</option>
                  </select>
                </div>

                {/* 问题2 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-3">
                    相比于<span className="font-medium">收益</span>，
                    <span className="font-medium">成本</span>有多重要？
                  </p>
                  <select
                    value={matrix.m02}
                    onChange={(e) => setMatrix({ ...matrix, m02: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">同等重要 (1)</option>
                    <option value="3">稍微重要 (3)</option>
                    <option value="5">明显重要 (5)</option>
                    <option value="7">非常重要 (7)</option>
                    <option value="9">极端重要 (9)</option>
                    <option value="1/3">稍微不重要 (1/3)</option>
                    <option value="1/5">明显不重要 (1/5)</option>
                  </select>
                </div>

                {/* 问题3 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-3">
                    相比于<span className="font-medium">收益</span>，
                    <span className="font-medium">工期</span>有多重要？
                  </p>
                  <select
                    value={matrix.m12}
                    onChange={(e) => setMatrix({ ...matrix, m12: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">同等重要 (1)</option>
                    <option value="3">稍微重要 (3)</option>
                    <option value="5">明显重要 (5)</option>
                    <option value="7">非常重要 (7)</option>
                    <option value="9">极端重要 (9)</option>
                    <option value="1/3">稍微不重要 (1/3)</option>
                    <option value="1/5">明显不重要 (1/5)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  上一步
                </button>
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '计算中...' : '计算权重'}
                </button>
              </div>
            </div>
          )}

          {/* 步骤3: 结果 */}
          {step === 3 && result && (
            <div>
              <h3 className="text-xl font-semibold mb-6">计算结果</h3>

              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">一致性比率 (CR)</p>
                <p
                  className={`text-2xl font-bold ${result.is_valid ? 'text-green-600' : 'text-red-600'}`}
                >
                  {result.consistency_ratio.toFixed(4)}
                </p>
                <p className={`text-sm ${result.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                  {result.is_valid ? '✅ 一致性检验通过' : '❌ 一致性检验失败，请重新设定'}
                </p>
              </div>

              {result.is_valid && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <p className="font-medium mb-3">最终权重分配:</p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="w-20">💰 成本</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${result.weights.cost * 100}%` }}
                          />
                        </div>
                        <span className="w-16 text-right">
                          {(result.weights.cost * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-20">⏱️ 工期</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{ width: `${result.weights.time * 100}%` }}
                          />
                        </div>
                        <span className="w-16 text-right">
                          {(result.weights.time * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-20">📈 收益</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-purple-600"
                            style={{ width: `${result.weights.benefit * 100}%` }}
                          />
                        </div>
                        <span className="w-16 text-right">
                          {(result.weights.benefit * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      重新设定
                    </button>
                    <button
                      onClick={() => onComplete(result.weights)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      应用权重并决策
                    </button>
                  </div>
                </>
              )}

              {!result.is_valid && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    重新设定
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
