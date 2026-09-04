import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock3, Eye, Loader2, Plus, Radio, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/useAuth";
import { useAddWatchlistItem, useDeleteWatchlistItem, useWatchlist, useWatchlistDigest } from "@/hooks/useWatchlist";
import { formatCurrency, formatPct } from "@/lib/format";
import type { WatchlistDigestItem } from "@/types";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Smart watchlist — PulseFolio" },
      {
        name: "description",
        content: "See which watched tickers changed meaningfully since your last visit.",
      },
    ],
  }),
  component: WatchlistPage,
});

function ageLabel(seconds: number) {
  if (seconds < 60) return `updated ${seconds}s ago`;
  if (seconds < 3600) return `updated ${Math.floor(seconds / 60)}m ago`;
  return `updated ${Math.floor(seconds / 3600)}h ago`;
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (
    <div className="flex h-12 items-end gap-0.5" aria-label="30-day price trend">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="min-w-0 flex-1 rounded-t-sm bg-primary/55"
          style={{ height: `${18 + ((value - min) / range) * 82}%` }}
        />
      ))}
    </div>
  );
}

function DigestCard({ item, onDelete }: { item: WatchlistDigestItem; onDelete: () => void }) {
  const positive = item.change_pct >= 0;
  return (
    <article className="rounded-xl border border-border bg-surface/55 p-4 transition-colors hover:border-primary/40">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-28">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-lg font-semibold">{item.ticker}</h3>
            {item.attention_score > 0 ? <Badge variant="default">Attention {Math.round(item.attention_score)}</Badge> : null}
          </div>
          <p className="mt-1 font-mono text-sm tabular-nums">{formatCurrency(item.price, true)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ageLabel(item.freshness_seconds)}</p>
        </div>
        <div className="min-w-0 flex-1">
          {item.is_stale ? (
            <Badge variant="destructive" className="mb-2 gap-1">
              <TriangleAlert className="size-3" /> Data delayed
            </Badge>
          ) : (
            <p className="mb-2 flex items-center gap-1 text-xs text-positive"><Radio className="size-3" /> Data fresh</p>
          )}
          <div className="space-y-1">
            {item.changes.map((change) => (
              <p key={change} className="text-sm font-medium">{change}</p>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {item.changes.length ? `Relative move: ${formatPct(item.change_pct)} · Volume: ${item.volume_ratio.toFixed(1)}x average` : "No statistically unusual movement since your last visit."}
          </p>
        </div>
        <div className="w-full sm:w-44">
          <Sparkline values={item.sparkline} />
          <p className={`mt-1 text-right font-mono text-xs ${positive ? "text-positive" : "text-negative"}`}>
            {formatPct(item.change_pct)} since last visit
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label={`Remove ${item.ticker}`} onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </article>
  );
}

function WatchlistPage() {
  const { ready } = useRequireAuth();
  const [ticker, setTicker] = useState("");
  const watchlist = useWatchlist(ready);
  const digest = useWatchlistDigest(ready);
  const add = useAddWatchlistItem();
  const remove = useDeleteWatchlistItem();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = ticker.trim().toUpperCase();
    if (!value) return;
    add.mutate(value, { onSuccess: () => setTicker("") });
  };

  const items = digest.data?.items ?? [];
  const notable = items.filter((item) => item.attention_score > 0);
  const quiet = items.filter((item) => item.attention_score === 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Smart watchlist</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A ranked digest of what is unusual since you last looked, relative to each ticker's own volatility.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="size-3.5 text-positive" /> Shared live ticker feed
        </div>
      </div>

      <Card className="mt-6 shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Track a ticker</CardTitle>
          <CardDescription>Add a symbol to start building your personal attention digest.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex max-w-xl gap-2" onSubmit={submit}>
            <Input value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="RELIANCE, TCS, INFY" aria-label="Ticker symbol" />
            <Button type="submit" disabled={add.isPending || !ticker.trim()}>
              {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add ticker
            </Button>
          </form>
        </CardContent>
      </Card>

      {!watchlist.isLoading && (watchlist.data?.length ?? 0) === 0 ? (
        <div className="mt-6"><EmptyState title="Your watchlist is empty" description="Add a ticker above and PulseFolio will track unusual moves for you." /></div>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Attention digest</h2>
              <p className="text-sm text-muted-foreground">{notable.length} notable change{notable.length === 1 ? "" : "s"} since your last visit</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> Refreshes every 30s</span>
          </div>
          <div className="mt-4 space-y-3">
            {digest.isLoading ? <><Skeleton className="h-36 w-full" /><Skeleton className="h-36 w-full" /></> : notable.length ? notable.map((item) => <DigestCard key={item.id} item={item} onDelete={() => remove.mutate(item.id)} />) : <Card><CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground"><Activity className="size-4 text-primary" /> Nothing statistically unusual since your last visit.</CardContent></Card>}
          </div>
          <div className="mt-8">
            <h2 className="text-base font-semibold">No notable changes</h2>
            <div className="mt-3 space-y-2">
              {quiet.length ? quiet.map((item) => <DigestCard key={item.id} item={item} onDelete={() => remove.mutate(item.id)} />) : <p className="text-sm text-muted-foreground">Every watched ticker currently has a notable change.</p>}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
