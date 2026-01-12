import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function YieldCard({
  title,
  value,
  trend,
}: {
  title: string
  value: string | number
  trend?: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            {trend > 0 ? "+" : ""}
            {trend}% from last hour
          </p>
        )}
      </CardContent>
    </Card>
  )
}
