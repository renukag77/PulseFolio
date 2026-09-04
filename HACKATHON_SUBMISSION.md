# Hackathon Submission

## Title

PulseFolio: Explainable Portfolio Health, Rebalancing & Smart Watchlist

## Description

PulseFolio helps retail investors understand the real health and diversification of their investment portfolio.

Users can create an account, add stocks and mutual funds manually, import holdings through CSV or TSV, view portfolio value and gains, manage price alerts, and track a personalized Smart Watchlist.

The dashboard calculates a transparent Portfolio Health Score from 0 to 100 using the Herfindahl-Hirschman Index for diversification, sector concentration risk, and asset-class balance. It then turns the analysis into explainable rebalancing recommendations such as reducing concentrated sector exposure or adding an underrepresented asset class.

The Smart Watchlist goes beyond a basic price table. It ranks what deserves attention since the user's last visit by comparing price movement with each ticker's own volatility, detecting volume spikes, volatility regime shifts, and 52-week range breaches. Shared ticker state is streamed over WebSockets while per-user snapshots create a personalized change digest.

PulseFolio includes allocation charts, top holdings, CSV import, authentication, alerts, live updates, persistent hosted PostgreSQL storage, and a local SQLite fallback for development.

## Theme

What to build? - CODE 2026

## Links

- Demo: https://pulsefolio.renukaguruguntla.workers.dev
- Repository: https://github.com/renukaguruguntla/PulseFolio
- Video: https://drive.google.com/file/d/13VGogGc7vMS6uJ5TYhwXv-SD7cwCzZx0/view?usp=sharing

## Instructions to Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/renukaguruguntla/PulseFolio.git
   cd PulseFolio
   ```

2. Install frontend dependencies:

   ```bash
   npm install
   ```

3. Create and install the backend environment:

   ```bash
   python3 -m venv backend/.venv
   backend/.venv/bin/pip install -r backend/requirements.txt
   cp env.example .env
   ```

4. Keep the local frontend environment as:

   ```text
   VITE_API_BASE_URL=http://localhost:8000
   ```

5. Start the backend in Terminal 1:

   ```bash
   backend/.venv/bin/python -m uvicorn app.main:app --reload --port 8000 --app-dir backend
   ```

6. Start the frontend in Terminal 2:

   ```bash
   npm run dev
   ```

7. Open the Vite URL, usually `http://localhost:8080`, and create an account with a password of at least six characters.

The local backend uses SQLite and creates `backend/pulsefolio.db`. Hosted Render deployment uses Neon PostgreSQL through the private `DATABASE_URL` environment variable.

## Test CSV

```csv
ticker,asset_type,quantity,buy_price
RELIANCE,stock,10,2750
INFY,stock,15,1450
GOLDBEES,gold,100,54
LIQUIDBEES,debt,30,980
```

The importer accepts comma-separated CSV and tab-separated TSV files.