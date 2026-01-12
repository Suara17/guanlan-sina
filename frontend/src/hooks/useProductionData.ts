import { useSuspenseQuery } from "@tanstack/react-query"
import { ProductionService } from "@/client"

export function useProductionOverview() {
  return useSuspenseQuery({
    queryKey: ["production", "overview"],
    queryFn: () => ProductionService.readProductionOverview(),
    refetchInterval: 5000,
  })
}
