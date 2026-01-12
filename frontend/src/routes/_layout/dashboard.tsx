import { createFileRoute } from "@tanstack/react-router"
import { ProductionChart } from "@/components/Dashboard/ProductionChart"
import { YieldCard } from "@/components/Dashboard/YieldCard"
import { useProductionOverview } from "@/hooks/useProductionData"

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const { data: overview } = useProductionOverview()

  // Cast overview to any because OpenAPI generator might have typed it as 'unknown' or generic
  const stats = overview as any

  return (
    <div className="flex h-full flex-col p-4 md:p-8 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Production Overview (GuanLan)
      </h1>

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
          <ProductionChart />
        </div>
      </div>
    </div>
  )
}
