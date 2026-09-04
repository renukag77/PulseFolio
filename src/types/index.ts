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
