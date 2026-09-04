# PulseFolio — Portfolio Health & Rebalancing Assistant (frontend)

PulseFolio ingests a retail investor's holdings (stocks, mutual funds, gold, debt) and shows,
in near real time, how healthy and diversified the portfolio actually is:

- **Portfolio Health Score (0–100)** gauge with a breakdown of the three sub-scores
  (diversification via HHI, sector concentration, asset-class balance)
- **Rebalancing recommendations** in plain language, straight from the backend engine
- **Allocation donuts** by sector and by asset type, plus a top-holdings table with gain/loss
- **Holdings management** with manual add, delete, and drag-and-drop CSV import
- **Price alerts** (above/below) with real-time toast notifications over WebSocket
- **Smart Watchlist** that ranks statistically unusual ticker changes since your last visit

This repository now includes a local FastAPI backend in `backend/`. It uses SQLite by default,
so you can run the complete app without provisioning a database. The frontend still talks to the
backend through the same REST and WebSocket contract and can be pointed at a deployed API later.

## Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | React 19 + TypeScript on TanStack Start (Vite 7) |
| Routing    | TanStack Router (file-based, in `src/routes`) |
| Styling    | Tailwind CSS v4 + shadcn/ui components, semantic tokens in `src/styles.css` |
| Charts     | Recharts |
| Data       | TanStack React Query |
| HTTP       | Axios instance that attaches the JWT bearer token from `localStorage` |
| Realtime   | Native `WebSocket` to `/ws/live` and `/ws/watchlist` |
| Toasts     | sonner |

> Note: routing uses TanStack Router rather than React Router — this project is built on
> TanStack Start, where the router is fixed. Everything else matches the original spec.

## Setup

```bash
npm install
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cp env.example .env
```

Start both services in separate VS Code terminals:

```bash
npm run backend:dev  # http://localhost:8000
npm run dev          # http://localhost:8080
```

Or start both with `npm run dev:full`. Open the frontend URL, create an account, and the backend
will create a small demo portfolio so the dashboard is immediately populated. The SQLite database
is created at `backend/pulsefolio.db` and is ignored by git.

### Environment variable

Create a `.env` file at the project root:

```
VITE_API_BASE_URL=http://localhost:8000
```

In production (e.g. Vercel), set `VITE_API_BASE_URL` to your deployed backend URL, for example
`https://pulsefolio-api.onrender.com`. The WebSocket URL is derived automatically by swapping
`http` → `ws`, so `https://` becomes `wss://`.

If the variable is unset, the app falls back to `http://localhost:8000`.

## Backend contract

This frontend expects a running backend implementing:

```
POST   /auth/signup            {email, password} -> {token}
POST   /auth/login             {email, password} -> {token}

GET    /holdings               -> [Holding]
POST   /holdings               {ticker, asset_type, quantity, buy_price} -> Holding
POST   /holdings/import-csv    (multipart "file") -> [Holding]
DELETE /holdings/{id}          -> 204

GET    /portfolio/summary      -> {total_value, total_gain, allocation_by_sector,
                                   allocation_by_asset_type, top_holdings}
GET    /portfolio/health-score -> {health_score, diversification_score, sector_score,
                                   balance_score, recommendations: [string]}

POST   /alerts                 {holding_id, threshold_price, direction} -> Alert
GET    /alerts                 -> [Alert]
DELETE /alerts/{id}            -> 204

GET    /watchlist                -> [WatchlistItem]
POST   /watchlist                {ticker} -> WatchlistItem
DELETE /watchlist/{id}           -> 204
GET    /watchlist/digest         -> {items, last_viewed_at}

WS     /ws/live                -> {type: "price_update"|"alert_triggered", payload}
WS     /ws/watchlist             -> {type: "ticker_update", payload}
```

## Smart Watchlist

The Smart Watchlist tracks chosen tickers and opens with a ranked attention digest instead of a
raw price table. It compares each ticker with the user's last viewed snapshot and keeps quiet
tickers visible in a separate section.

Meaningful change is relative to the ticker's own behavior: a price move is scored against its
30-day volatility, volume spikes are compared with average volume, and volatility-regime shifts
and 52-week range breaches add attention. This avoids treating a 2% move in a stable blue chip as
equivalent to a 2% move in a volatile small-cap.

Ticker state is shared across users and updated by one polling loop per unique watched ticker;
WebSocket updates are then fanned out only to users watching that ticker. The API includes a
freshness timestamp and `is_stale` flag, while the per-user snapshot makes “since I last looked”
personal. The current local demo uses deterministic simulated market updates; a production market
data provider can replace that poller without changing the watchlist API.

`allocation_by_sector` / `allocation_by_asset_type` may be either a `{label: value}` map or an
array of `{label, value}` — both are handled. Holdings may optionally include `name`, `sector`,
`last_price`, `current_value`, and `gain_pct`; when `last_price` is present the client derives
value and P&L itself, so `price_update` messages patch the table without a refetch.

The WebSocket connection appends the JWT as a `?token=` query parameter (browsers cannot set
headers on WebSocket handshakes) and auto-reconnects every 5s after a drop.

For deployment, set `JWT_SECRET`, `DATABASE_PATH`, and `FRONTEND_ORIGIN` from
`backend/.env.example` on the backend host. The included SQLite setup is intended for local
development. For hosted deployment, set `DATABASE_URL` to your Neon PostgreSQL connection string
and leave `DATABASE_PATH` unused; the backend creates the required tables on startup. Never commit
the connection string to GitHub.

## Folder structure

```
src/
├── api/            axios instance + calls grouped by resource
│   ├── client.ts   base URL, JWT interceptors, ws url helper
│   ├── auth.ts
│   ├── holdings.ts
│   ├── portfolio.ts
│   ├── alerts.ts
│   └── watchlist.ts
├── components/     AppShell, HealthGauge, AllocationDonut, StatCard, EmptyState, ui/ (shadcn)
├── hooks/          React Query hooks: useAuth, useHoldings, usePortfolio, useAlerts, useLiveUpdates
├── lib/            formatting helpers (INR currency, %, allocation normalisation)
├── routes/         file-based pages
│   ├── __root.tsx  html shell, head metadata, QueryClientProvider, Toaster
│   ├── index.tsx   Dashboard
│   ├── holdings.tsx
│   ├── alerts.tsx
│   ├── watchlist.tsx
│   └── auth.tsx    login / signup
├── types/          shared TypeScript interfaces matching the API responses
└── styles.css      design system (deep green/teal fintech palette)
```

Auth is enforced client-side: pages call `useRequireAuth()`, which redirects to `/auth` when no
JWT is present, and a 401 from any API call clears the token and bounces back to `/auth`.
