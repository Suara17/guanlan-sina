import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: "观澜-司南 | 智能决策支持平台",
      },
      {
        name: "description",
        content: "基于AI的工业生产智能决策支持平台，为制造业提供实时监控、异常检测和智能决策服务。",
      },
    ],
  }),
})

function LandingPage() {
  const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("access_token") !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <span className="text-2xl font-bold text-white">司</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                观澜·司南
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                智能决策支持平台
              </p>
            </div>
          </div>

          <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            赋能工业生产，
            <span className="text-blue-600 dark:text-blue-400">智能决策</span>
          </h2>

          <p className="mb-8 text-xl text-slate-600 dark:text-slate-400">
            基于AI技术的工业生产监控平台，为制造业提供实时异常检测、智能诊断和决策支持服务。
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to={isLoggedIn ? "/dashboard" : "/login"}>
                {isLoggedIn ? "进入仪表板" : "立即登录"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              了解更多
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            核心功能
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            全方位保障您的生产安全与效率
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-white">
                实时监控
              </CardTitle>
              <CardDescription>
                全天候监控生产设备运行状态，及时发现潜在问题
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-white">
                异常检测
              </CardTitle>
              <CardDescription>
                AI智能分析生产数据，自动识别异常情况并预警
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-white">
                智能决策
              </CardTitle>
              <CardDescription>
                基于历史数据和AI分析，提供优化建议和决策支持
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center text-white">
          <h3 className="mb-4 text-3xl font-bold">
            立即体验智能决策支持平台
          </h3>
          <p className="mb-8 text-xl opacity-90">
            加入我们，提升您的生产效率和决策质量
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to={isLoggedIn ? "/dashboard" : "/login"}>
              {isLoggedIn ? "进入系统" : "免费开始使用"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                <span className="text-sm font-bold text-white">司</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                观澜·司南
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2026 观澜-司南智能决策支持平台. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
