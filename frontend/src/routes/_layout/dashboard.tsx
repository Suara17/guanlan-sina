import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { UtilsService } from "@/client"
import { ProductionChart } from "@/components/Dashboard/ProductionChart"
import { YieldCard } from "@/components/Dashboard/YieldCard"
import useAuth from "@/hooks/useAuth"
import { useProductionOverview } from "@/hooks/useProductionData"

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "仪表板 - 观澜-司南",
      },
    ],
  }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const { data: overview } = useProductionOverview()
  const {
    data: pingData,
    error: pingError,
    isLoading: pingLoading,
  } = useQuery({
    queryKey: ["ping-test"],
    queryFn: UtilsService.pingTest,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Cast overview to any because OpenAPI generator might have typed it as 'unknown' or generic
  const stats = overview as any

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl truncate max-w-sm">
          Hi, {currentUser?.full_name || currentUser?.email} 👋
        </h1>
        <p className="text-muted-foreground">
          Welcome back, nice to see you again!!!
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">本地开发环境状态</h2>
        {pingLoading ? (
          <p className="text-muted-foreground">正在检查连接...</p>
        ) : pingError ? (
          <div className="text-red-600">
            <p className="font-medium">连接失败</p>
            <pre className="text-sm mt-1 bg-red-50 p-2 rounded border">
              {pingError.message}
            </pre>
          </div>
        ) : pingData ? (
          <div className="text-green-600">
            <p className="font-medium">✅ 后端连接成功</p>
            <pre className="text-sm mt-2 bg-green-50 p-3 rounded border overflow-x-auto">
              {JSON.stringify(pingData, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="flex h-full flex-col space-y-4">
        <h2 className="text-xl font-bold tracking-tight">生产概览 (观澜)</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <YieldCard title="Total Target" value={stats?.total_target || 0} />
          <YieldCard title="Total Actual" value={stats?.total_actual || 0} />
          <YieldCard
            title="Overall Yield"
            value={`${((stats?.overall_yield || 0) * 100).toFixed(1)}%`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="mb-4 text-lg font-semibold">Line Output</div>
            <ProductionChart data={stats?.line_stats || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
