import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { UtilsService } from "@/client"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - FastAPI Cloud",
      },
    ],
  }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  const { data, error, isLoading } = useQuery({
    queryKey: ["ping-test"],
    queryFn: UtilsService.pingTest,
    retry: 1,
    refetchOnWindowFocus: false,
  })

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
        {isLoading ? (
          <p className="text-muted-foreground">正在检查连接...</p>
        ) : error ? (
          <div className="text-red-600">
            <p className="font-medium">连接失败</p>
            <pre className="text-sm mt-1 bg-red-50 p-2 rounded border">
              {error.message}
            </pre>
          </div>
        ) : data ? (
          <div className="text-green-600">
            <p className="font-medium">✅ 后端连接成功</p>
            <pre className="text-sm mt-2 bg-green-50 p-3 rounded border overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}
