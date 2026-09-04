import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
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
import { useRequireAuth } from "@/hooks/useAuth";
import { useCreateHolding, useDeleteHolding, useHoldings, useImportCsv } from "@/hooks/useHoldings";
import { ASSET_TYPE_LABELS, formatCurrency, formatNumber, formatPct } from "@/lib/format";
import type { AssetType } from "@/types";

export const Route = createFileRoute("/holdings")({
  head: () => ({
    meta: [
      { title: "Holdings — PulseFolio" },
      {
        name: "description",
        content:
          "Add stocks, mutual funds, gold and debt holdings manually or import them in bulk from a CSV file.",
      },
      { property: "og:title", content: "Holdings — PulseFolio" },
      {
        property: "og:description",
        content: "Manage the stocks and mutual funds behind your portfolio health score.",
      },
    ],
  }),
  component: HoldingsPage,
});

function HoldingsPage() {
  const { ready } = useRequireAuth();
  const { data, isLoading } = useHoldings(ready);
  const createHolding = useCreateHolding();
  const deleteHolding = useDeleteHolding();
  const importCsv = useImportCsv();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [ticker, setTicker] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("stock");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createHolding.mutate(
      {
        ticker: ticker.trim().toUpperCase(),
        asset_type: assetType,
        quantity: Number(quantity),
        buy_price: Number(buyPrice),
      },
      {
        onSuccess: () => {
          setTicker("");
          setQuantity("");
          setBuyPrice("");
        },
      },
    );
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) importCsv.mutate(file);
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Holdings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add positions one by one, or import a CSV with ticker, asset_type, quantity, buy_price.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Add a holding</CardTitle>
            <CardDescription>Ticker as your market data provider expects it.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker</Label>
                <Input
                  id="ticker"
                  required
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="INFY.NS"
                />
              </div>
              <div className="space-y-2">
                <Label>Asset type</Label>
                <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="mf">Mutual fund</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="debt">Debt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buy">Buy price (₹)</Label>
                  <Input
                    id="buy"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createHolding.isPending}>
                {createHolding.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Add holding
              </Button>
            </form>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`mt-6 cursor-pointer rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
                dragging ? "border-primary bg-secondary" : "border-border"
              }`}
              onClick={() => fileInput.current?.click()}
            >
              {importCsv.isPending ? (
                <Loader2 className="mx-auto size-5 animate-spin text-primary" />
              ) : (
                <Upload className="mx-auto size-5 text-primary" />
              )}
              <p className="mt-2 text-sm font-medium">Import CSV</p>
              <p className="text-xs text-muted-foreground">Drag &amp; drop a file, or click to browse</p>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Your positions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (data?.length ?? 0) === 0 ? (
              <EmptyState
                title="No holdings yet"
                description="Add your first one using the form on the left, or import a CSV."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Ticker</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Sector</th>
                      <th className="py-2 pr-4 text-right font-medium">Qty</th>
                      <th className="py-2 pr-4 text-right font-medium">Buy</th>
                      <th className="py-2 pr-4 text-right font-medium">LTP</th>
                      <th className="py-2 pr-4 text-right font-medium">Value</th>
                      <th className="py-2 pr-4 text-right font-medium">P&amp;L</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map((h) => {
                      const ltp = h.last_price ?? null;
                      const value = h.current_value ?? (ltp ?? h.buy_price) * h.quantity;
                      const gain =
                        h.gain_pct ?? (ltp ? ((ltp - h.buy_price) / h.buy_price) * 100 : null);
                      return (
                        <tr key={h.id} className="border-b border-border/60 last:border-0">
                          <td className="py-3 pr-4 font-medium">{h.ticker}</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {ASSET_TYPE_LABELS[h.asset_type] ?? h.asset_type}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{h.sector ?? "—"}</td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">
                            {formatNumber(h.quantity)}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">
                            {formatCurrency(h.buy_price, true)}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">
                            {formatCurrency(ltp, true)}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">
                            {formatCurrency(value)}
                          </td>
                          <td
                            className="py-3 pr-4 text-right font-mono tabular-nums"
                            style={{
                              color:
                                gain === null
                                  ? undefined
                                  : gain >= 0
                                    ? "var(--positive)"
                                    : "var(--negative)",
                            }}
                          >
                            {formatPct(gain)}
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${h.ticker}`}
                              onClick={() => deleteHolding.mutate(h.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
