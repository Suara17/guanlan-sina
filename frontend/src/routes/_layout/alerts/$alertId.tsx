import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckCircle, ChevronLeft, Play } from "lucide-react"
import { toast } from "sonner"
import { AnomaliesService, SolutionsService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/_layout/alerts/$alertId")({
  component: AlertDetail,
})

function AlertDetail() {
  const { alertId } = Route.useParams()
  const queryClient = useQueryClient()

  // Since we don't have a readAnomalyById API yet, we fetch all and find locally
  const { data: anomalies } = useSuspenseQuery({
    queryKey: ["anomalies"],
    queryFn: () => AnomaliesService.readAnomalies(),
  })

  const anomaly = anomalies.find((a) => a.id === alertId)

  const diagnosisMutation = useMutation({
    mutationFn: () => AnomaliesService.triggerDiagnosis({ id: alertId }),
    onSuccess: () => {
      toast.success("Diagnosis complete")
      queryClient.invalidateQueries({ queryKey: ["anomalies"] })
    },
    onError: (err) => {
      toast.error(`Diagnosis failed: ${err.message || "Unknown error"}`)
    },
  })

  const selectSolutionMutation = useMutation({
    mutationFn: (solutionId: string) =>
      SolutionsService.selectSolution({ id: solutionId }),
    onSuccess: () => {
      toast.success("Solution selected, Work Order created")
      queryClient.invalidateQueries({ queryKey: ["anomalies"] })
    },
    onError: (err) => {
      toast.error(`Selection failed: ${err.message || "Unknown error"}`)
    },
  })

  const diagnosis = diagnosisMutation.data

  if (!anomaly) {
    return (
      <div className="p-6">
        <div className="text-destructive font-bold">Anomaly not found</div>
        <Link
          to="/alerts"
          className="text-primary hover:underline mt-4 inline-block"
        >
          &larr; Back to Alerts
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/alerts">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Alert Details
            <Badge
              variant={anomaly.status === "open" ? "destructive" : "secondary"}
            >
              {anomaly.status}
            </Badge>
          </h1>
          <span className="text-muted-foreground text-sm font-mono">
            ID: {alertId}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-base">{anomaly.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Severity
                </p>
                <p className="text-base capitalize">{anomaly.severity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Time
                </p>
                <p className="text-base">
                  {anomaly.created_at
                    ? new Date(anomaly.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Line ID
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  {anomaly.line_id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Station ID
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  {anomaly.station_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Diagnostics (SiNan)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center space-y-4">
            {anomaly.status === "diagnosed" ||
            anomaly.status === "in_progress" ||
            diagnosis ? (
              <div className="text-center w-full">
                <div className="bg-green-50 text-green-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <p className="font-medium text-green-700 mb-2">
                  Diagnosis Completed
                </p>
                {!diagnosis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => diagnosisMutation.mutate()}
                    disabled={diagnosisMutation.isPending}
                  >
                    {diagnosisMutation.isPending
                      ? "Loading Results..."
                      : "View Results"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                No diagnosis has been run for this anomaly yet.
              </div>
            )}

            {!diagnosis &&
              anomaly.status !== "diagnosed" &&
              anomaly.status !== "in_progress" && (
                <Button
                  onClick={() => diagnosisMutation.mutate()}
                  disabled={diagnosisMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {diagnosisMutation.isPending
                    ? "Diagnosing..."
                    : "Run AI Diagnosis"}
                </Button>
              )}
          </CardContent>
        </Card>
      </div>

      {diagnosis && (
        <Card className="border-primary/50 shadow-md animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex justify-between items-center">
              <span>Diagnosis Result</span>
              <Badge variant="outline" className="bg-background">
                Confidence:{" "}
                {(diagnosis.confidence
                  ? diagnosis.confidence * 100
                  : 0
                ).toFixed(1)}
                %
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Root Cause Analysis
              </h3>
              <div className="bg-muted p-4 rounded-md border-l-4 border-primary">
                <p className="text-base">{diagnosis.root_cause}</p>
              </div>
            </div>

            {diagnosis.solutions && diagnosis.solutions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Recommended Solutions
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {diagnosis.solutions.map((sol) => (
                    <Card
                      key={sol.id}
                      className={`overflow-hidden flex flex-col ${
                        sol.recommended ? "border-green-500 border-2" : ""
                      }`}
                    >
                      {sol.recommended && (
                        <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 text-center uppercase tracking-wider">
                          Recommended
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {sol.solution_name}
                          </CardTitle>
                          <Badge variant="secondary">
                            ROI: {sol.roi ?? "N/A"}
                          </Badge>
                        </div>
                        <CardDescription>{sol.solution_type}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4 flex-1">
                        <p className="text-sm text-muted-foreground mb-4">
                          {sol.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-semibold">Downtime:</span>{" "}
                            {sol.estimated_downtime_hours}h
                          </div>
                          <div>
                            <span className="font-semibold">Success Rate:</span>{" "}
                            {(sol.success_rate ?? 0) * 100}%
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          className="w-full"
                          variant={sol.recommended ? "default" : "secondary"}
                          onClick={() => selectSolutionMutation.mutate(sol.id)}
                          disabled={
                            selectSolutionMutation.isPending ||
                            anomaly.status === "in_progress"
                          }
                        >
                          {anomaly.status === "in_progress"
                            ? "Work Order Active"
                            : "Select & Create Work Order"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
