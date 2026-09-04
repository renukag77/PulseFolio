import { api } from "./client";
import type { HealthScore, PortfolioSummary } from "@/types";

export async function getSummary(): Promise<PortfolioSummary> {
  const { data } = await api.get<PortfolioSummary>("/portfolio/summary");
  return data;
}

export async function getHealthScore(): Promise<HealthScore> {
  const { data } = await api.get<HealthScore>("/portfolio/health-score");
  return data;
}
