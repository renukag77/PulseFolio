import { useQuery } from "@tanstack/react-query";
import { getHealthScore, getSummary } from "@/api/portfolio";

export const portfolioKeys = {
  summary: ["portfolio", "summary"] as const,
  health: ["portfolio", "health-score"] as const,
};

export function usePortfolioSummary(enabled = true) {
  return useQuery({
    queryKey: portfolioKeys.summary,
    queryFn: getSummary,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useHealthScore(enabled = true) {
  return useQuery({
    queryKey: portfolioKeys.health,
    queryFn: getHealthScore,
    enabled,
    refetchInterval: 60_000,
  });
}
