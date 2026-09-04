import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Lightbulb, Radio } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AllocationDonut } from "@/components/AllocationDonut";
import { EmptyState } from "@/components/EmptyState";
import { HealthGauge } from "@/components/HealthGauge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";
import { useHoldings } from "@/hooks/useHoldings";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { useHealthScore, usePortfolioSummary } from "@/hooks/usePortfolio";
import { ASSET_TYPE_LABELS, formatCurrency, formatPct, toSlices } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseFolio — Portfolio Health & Rebalancing Dashboard" },
      {
        name: "description",
        content:
          "See your live portfolio value, a 0–100 health score from diversification, sector and asset-class balance, plus concrete rebalancing actions.",
      },
      { property: "og:title", content: "PulseFolio — Portfolio Health Dashboard" },
      {
        property: "og:description",
        content:
          "Live portfolio value, health score breakdown, allocation charts and rebalancing recommendations.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { ready } = useRequireAuth();
  const { status } = useLiveUpdates(ready);
  const summary = usePortfolioSummary(ready);
  const health = useHealthScore(ready);
  const holdings = useHoldings(ready);

  const sectorSlices = toSlices(summary.data?.allocation_by_sector);
  const assetSlices = toSlices(summary.data?.allocation_by_asset_type).map((s) => ({
    ...s,
    label: ASSET_TYPE_LABELS[s.label] ?? s.label,
  }));
  const topHoldings =
    summary.data?.top_holdings ??
    (holdings.data ?? [])
      .map((h) => ({
        ticker: h.ticker,
        name: h.name,
        current_value: h.current_value ?? (h.last_price ?? h.buy_price) * h.quantity,
        gain_pct:
          h.gain_pct ??
          (h.last_price ? ((h.last_price - h.buy_price) / h.buy_price) * 100 : 0),
      }))
      .sort((a, b) => b.current_value - a.current_value)
      .slice(0, 8);

  const isEmpty = ready && !holdings.isLoading && (holdings.data?.length ?? 0) === 0;
  const totalGain = summary.data?.total_gain ?? 0;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portfolio value</p>
          <p className="font-mono text-4xl font-semibold tabular-nums">
            {summary.isLoading ? <Skeleton className="h-10 w-52" /> : formatCurrency(summary.data?.total_value)}
          </p>
          {!summary.isLoading && summary.data ? (
            <p
              className="mt-1 font-mono text-sm"
              style={{ color: totalGain >= 0 ? "var(--positive)" : "var(--negative)" }}
            >
              {totalGain >= 0 ? "+" : ""}
              {formatCurrency(totalGain)} overall{" "}
              {summary.data.total_gain_pct !== undefined ? `(${formatPct(summary.data.total_gain_pct)})` : ""}
            </p>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-muted-foreground">
          <Radio
            className="size-3.5"
            style={{ color: status === "live" ? "var(--positive)" : "var(--muted-foreground)" }}
          />
          {status === "live" ? "Live prices" : status === "connecting" ? "Connecting…" : "Live feed offline"}
        </span>
      </div>

      {isEmpty ? (
        <div className="mt-8">
          <EmptyState
            title="No holdings yet"
            description="Add your first stock or mutual fund to compute your health score."
            action={
              <Button asChild>
                <Link to="/holdings">Add a holding</Link>
              </Button>
            }
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle>Portfolio health score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {health.isLoading ? (
              <Skeleton className="size-52 rounded-full" />
            ) : (
              <HealthGauge score={health.data?.health_score ?? 0} />
            )}
            <p className="text-center text-xs text-muted-foreground">
              0.4 × diversification + 0.3 × sector balance + 0.3 × asset balance
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Diversification"
              value={health.data ? `${Math.round(health.data.diversification_score)}` : "—"}
              hint="100 × (1 − HHI)"
            />
            <StatCard
              label="Sector balance"
              value={health.data ? `${Math.round(health.data.sector_score)}` : "—"}
              hint="Penalty above 30% per sector"
            />
            <StatCard
              label="Asset balance"
              value={health.data ? `${Math.round(health.data.balance_score)}` : "—"}
              hint="Deviation from target mix"
            />
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" />
                Rebalancing actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health.isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (health.data?.recommendations?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No action needed — your allocation is within target bands.
                </p>
              ) : (
                health.data?.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Allocation by sector</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? <Skeleton className="h-64 w-full" /> : <AllocationDonut data={sectorSlices} />}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Allocation by asset type</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? <Skeleton className="h-64 w-full" /> : <AllocationDonut data={assetSlices} />}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 shadow-card">
        <CardHeader>
          <CardTitle>Top holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.isLoading || holdings.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : topHoldings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holdings to show yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Ticker</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 text-right font-medium">Current value</th>
                    <th className="py-2 text-right font-medium">Gain / loss</th>
                  </tr>
                </thead>
                <tbody>
                  {topHoldings.map((h) => (
                    <tr key={h.ticker} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-medium">{h.ticker}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{h.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums">
                        {formatCurrency(h.current_value)}
                      </td>
                      <td
                        className="py-3 text-right font-mono tabular-nums"
                        style={{ color: h.gain_pct >= 0 ? "var(--positive)" : "var(--negative)" }}
                      >
                        {formatPct(h.gain_pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
