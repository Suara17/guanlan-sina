import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { useState } from "react"
import { type CaseLibrary, CasesService } from "@/client"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/_layout/knowledge")({
  component: KnowledgeBase,
  head: () => ({
    meta: [
      {
        title: "知识库 - 观澜-司南",
      },
    ],
  }),
})

function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases", searchQuery],
    queryFn: () =>
      CasesService.readCasesApiV1CasesGet({
        skip: 0,
        limit: 100,
        search: searchQuery || undefined,
      }),
    refetchOnWindowFocus: false,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">知识库</h1>
        <p className="text-muted-foreground">
          历史异常案例与解决方案库，学习和参考过往经验
        </p>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索问题描述或经验教训..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 案例列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : cases && cases.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cases.map((caseItem: CaseLibrary) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "未找到匹配的案例" : "暂无案例记录"}
        </div>
      )}
    </div>
  )
}

function CaseCard({ caseItem }: { caseItem: CaseLibrary }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          {caseItem.problem_description || "未命名案例"}
        </CardTitle>
        <CardDescription>
          {new Date(caseItem.created_at).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 诊断结果 */}
        {caseItem.diagnosis_result && (
          <div>
            <h4 className="text-sm font-semibold mb-1">诊断结果</h4>
            <p className="text-sm text-muted-foreground">
              根本原因: {caseItem.diagnosis_result.root_cause || "未知"}
            </p>
            {caseItem.diagnosis_result.confidence && (
              <p className="text-sm text-muted-foreground">
                置信度:{" "}
                {(caseItem.diagnosis_result.confidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
        )}

        {/* 效果对比 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {caseItem.expected_effect && (
            <div>
              <h4 className="font-semibold mb-1">预期效果</h4>
              <p className="text-muted-foreground">
                停机时长:{" "}
                {caseItem.expected_effect.downtime_hours?.toFixed(1) || "-"}{" "}
                小时
              </p>
              <p className="text-muted-foreground">
                预计损失: ¥{caseItem.expected_effect.cost?.toFixed(0) || "-"}
              </p>
            </div>
          )}
          {caseItem.actual_effect && (
            <div>
              <h4 className="font-semibold mb-1">实际效果</h4>
              <p className="text-muted-foreground">
                停机时长:{" "}
                {caseItem.actual_effect.downtime_hours?.toFixed(1) || "-"} 小时
              </p>
              <p className="text-muted-foreground">
                实际损失: ¥{caseItem.actual_effect.cost?.toFixed(0) || "-"}
              </p>
              <Badge
                variant={
                  caseItem.actual_effect.result === "success"
                    ? "default"
                    : "destructive"
                }
                className="mt-1"
              >
                {caseItem.actual_effect.result === "success"
                  ? "执行成功"
                  : "执行失败"}
              </Badge>
            </div>
          )}
        </div>

        {/* 经验教训 */}
        {caseItem.lessons_learned && (
          <div>
            <h4 className="text-sm font-semibold mb-1">经验教训</h4>
            <p className="text-sm text-muted-foreground">
              {caseItem.lessons_learned}
            </p>
          </div>
        )}

        {/* 标签 */}
        {caseItem.tags && caseItem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {caseItem.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
