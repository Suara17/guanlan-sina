import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AnomaliesService } from "@/client"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/_layout/alerts/")({
  component: AlertsIndex,
})

function AlertsIndex() {
  const { data: anomalies } = useSuspenseQuery({
    queryKey: ["anomalies"],
    queryFn: () => AnomaliesService.readAnomalies(),
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Alert Center</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anomalies.map((anomaly) => (
              <TableRow key={anomaly.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {anomaly.id?.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      anomaly.status === "open" ? "destructive" : "secondary"
                    }
                  >
                    {anomaly.status}
                  </Badge>
                </TableCell>
                <TableCell>{anomaly.severity}</TableCell>
                <TableCell
                  className="max-w-md truncate"
                  title={anomaly.description}
                >
                  {anomaly.description}
                </TableCell>
                <TableCell>
                  {anomaly.created_at
                    ? new Date(anomaly.created_at).toLocaleString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Link
                    to="/alerts/$alertId"
                    params={{ alertId: anomaly.id! }}
                    className="text-primary hover:underline font-medium"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {anomalies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-4 text-muted-foreground"
                >
                  No alerts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
