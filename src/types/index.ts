export type AssetType = "stock" | "mf" | "gold" | "debt";
export type AlertDirection = "above" | "below";

export interface AuthResponse {
  token: string;
}

export interface Holding {
  id: number | string;
  user_id?: number | string;
  ticker: string;
  name?: string | null;
  asset_type: AssetType;
  sector?: string | null;
  quantity: number;
  buy_price: number;
  last_price?: number | null;
  current_value?: number | null;
  gain_pct?: number | null;
  created_at?: string;
}

export interface NewHolding {
  ticker: string;
  asset_type: AssetType;
  quantity: number;
  buy_price: number;
}

export interface AllocationSlice {
  label: string;
  value: number;
  weight?: number;
}

export interface TopHolding {
  ticker: string;
  name?: string | null;
  current_value: number;
  gain_pct: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_gain: number;
  total_gain_pct?: number;
  allocation_by_sector: Record<string, number> | AllocationSlice[];
  allocation_by_asset_type: Record<string, number> | AllocationSlice[];
  top_holdings: TopHolding[];
}

export interface HealthScore {
  health_score: number;
  diversification_score: number;
  sector_score: number;
  balance_score: number;
  recommendations: string[];
}

export interface Alert {
  id: number | string;
  holding_id: number | string;
  threshold_price: number;
  direction: AlertDirection;
  is_triggered: boolean;
  created_at?: string;
}

export interface NewAlert {
  holding_id: number | string;
  threshold_price: number;
  direction: AlertDirection;
}

export type LiveMessage =
  | { type: "price_update"; payload: { ticker: string; last_price: number } }
  | {
      type: "alert_triggered";
      payload: { ticker?: string; threshold_price?: number; direction?: AlertDirection; message?: string };
    };

export interface WatchlistState {
  ticker: string;
  price: number;
  volume: number;
  avg_volume: number;
  volatility_5d: number;
  volatility_30d: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  updated_at: string;
  is_stale: boolean;
}

export interface WatchlistItem {
  id: number | string;
  user_id?: number | string;
  ticker: string;
  added_at: string;
  state: WatchlistState;
}

export interface WatchlistDigestItem extends WatchlistState {
  id: number | string;
  attention_score: number;
  changes: string[];
  freshness_seconds: number;
  change_pct: number;
  z_score: number;
  volume_ratio: number;
  sparkline: number[];
}

export interface WatchlistDigest {
  items: WatchlistDigestItem[];
  last_viewed_at: string;
}

export type WatchlistLiveMessage = {
  type: "ticker_update";
  payload: Pick<WatchlistState, "ticker" | "price" | "volume" | "updated_at" | "is_stale">;
};
