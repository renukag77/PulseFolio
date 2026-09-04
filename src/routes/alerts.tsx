import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellRing, Loader2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts, useCreateAlert, useDeleteAlert } from "@/hooks/useAlerts";
import { useRequireAuth } from "@/hooks/useAuth";
import { useHoldings } from "@/hooks/useHoldings";
import { formatCurrency } from "@/lib/format";
import type { AlertDirection } from "@/types";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Price alerts — PulseFolio" },
      {
        name: "description",
        content:
          "Set above/below price alerts on any holding and get notified in real time when a threshold is crossed.",
      },
      { property: "og:title", content: "Price alerts — PulseFolio" },
      {
        property: "og:description",
        content: "Real-time price alerts pushed over WebSocket for your portfolio holdings.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { ready } = useRequireAuth();
  const alerts = useAlerts(ready);
  const holdings = useHoldings(ready);
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();

  const [holdingId, setHoldingId] = useState("");
  const [threshold, setThreshold] = useState("");
  const [direction, setDirection] = useState<AlertDirection>("above");

  const tickerFor = (id: string | number) =>
    holdings.data?.find((h) => String(h.id) === String(id))?.ticker ?? `#${id}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdingId) return;
    createAlert.mutate(
      { holding_id: holdingId, threshold_price: Number(threshold), direction },
      { onSuccess: () => setThreshold("") },
    );
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Price alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Alerts are evaluated on the backend against live prices and pushed to your dashboard instantly.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>New alert</CardTitle>
            <CardDescription>Pick a holding and a threshold price.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Holding</Label>
                <Select value={holdingId} onValueChange={setHoldingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a holding" />
                  </SelectTrigger>
                  <SelectContent>
                    {(holdings.data ?? []).map((h) => (
                      <SelectItem key={h.id} value={String(h.id)}>
                        {h.ticker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as AlertDirection)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Goes above</SelectItem>
                    <SelectItem value="below">Falls below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold price (₹)</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createAlert.isPending || !holdingId || (holdings.data?.length ?? 0) === 0}
              >
                {createAlert.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Create alert
              </Button>
              {(holdings.data?.length ?? 0) === 0 && !holdings.isLoading ? (
                <p className="text-xs text-muted-foreground">Add a holding first to create alerts.</p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Active alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (alerts.data?.length ?? 0) === 0 ? (
              <EmptyState
                title="No alerts yet"
                description="Create one on the left to be notified when a price crosses your threshold."
              />
            ) : (
              <ul className="space-y-3">
                {alerts.data?.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <BellRing className="size-4 text-primary" />
                    <span className="font-medium">{tickerFor(a.holding_id)}</span>
                    <span className="text-sm text-muted-foreground">
                      {a.direction === "above" ? "goes above" : "falls below"}
                    </span>
                    <span className="font-mono tabular-nums">{formatCurrency(a.threshold_price, true)}</span>
                    <Badge variant={a.is_triggered ? "default" : "secondary"} className="ml-auto">
                      {a.is_triggered ? "Triggered" : "Watching"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete alert"
                      onClick={() => deleteAlert.mutate(a.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
