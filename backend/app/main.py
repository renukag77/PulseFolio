from __future__ import annotations

import base64
import asyncio
import csv
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import time
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.getenv("DATABASE_PATH", str(ROOT / "pulsefolio.db")))
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "local-development-secret-change-me")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")
FRONTEND_ORIGINS = [origin.strip().rstrip("/") for origin in FRONTEND_ORIGIN.split(",") if origin.strip()]

ASSET_TYPES = {"stock", "mf", "gold", "debt"}
TARGET_MIX = {"stock": 0.60, "mf": 0.0, "gold": 0.10, "debt": 0.30}
PRICE_BASES = {"RELIANCE": 2_940.0, "TCS": 4_120.0, "INFY": 1_590.0, "HDFCBANK": 1_680.0, "ICICIBANK": 1_240.0, "GOLDBEES": 62.0, "LIQUIDBEES": 1_000.0}
DEFAULTS = {
    "RELIANCE": ("Reliance Industries", "Energy"),
    "TCS": ("Tata Consultancy Services", "IT"),
    "INFY": ("Infosys", "IT"),
    "HDFCBANK": ("HDFC Bank", "Financials"),
    "ICICIBANK": ("ICICI Bank", "Financials"),
    "GOLDBEES": ("GoldBeES", "Gold"),
    "LIQUIDBEES": ("Liquid BeES", "Cash"),
}

security = HTTPBearer(auto_error=False)
connections: set[WebSocket] = set()
connections_lock = threading.Lock()
watch_connections: dict[WebSocket, int] = {}


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class HoldingPayload(BaseModel):
    ticker: str = Field(min_length=1, max_length=24)
    asset_type: str
    quantity: float = Field(gt=0)
    buy_price: float = Field(gt=0)


class AlertPayload(BaseModel):
    holding_id: int
    threshold_price: float = Field(gt=0)
    direction: str


class WatchlistPayload(BaseModel):
    ticker: str = Field(min_length=1, max_length=24)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PostgresConnection:
    def __init__(self, connection: psycopg.Connection):
        self.connection = connection

    def __enter__(self) -> "PostgresConnection":
        return self

    def __exit__(self, exception_type: Any, exception: Any, traceback: Any) -> None:
        if exception_type:
            self.connection.rollback()
        else:
            self.connection.commit()
        self.connection.close()

    @staticmethod
    def _query(query: str) -> str:
        return query.replace("?", "%s")

    def execute(self, query: str, parameters: Any = ()):
        return self.connection.execute(self._query(query), parameters)

    def executemany(self, query: str, parameters: Any):
        return self.connection.executemany(self._query(query), parameters)


def db() -> Any:
    if DATABASE_URL:
        return PostgresConnection(psycopg.connect(DATABASE_URL, row_factory=dict_row))
    connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    if not DATABASE_URL:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as connection:
        schema = (
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS holdings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                ticker TEXT NOT NULL,
                name TEXT,
                asset_type TEXT NOT NULL,
                sector TEXT NOT NULL,
                quantity REAL NOT NULL,
                buy_price REAL NOT NULL,
                last_price REAL NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                holding_id INTEGER NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
                threshold_price REAL NOT NULL,
                direction TEXT NOT NULL,
                is_triggered INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS watchlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                ticker TEXT NOT NULL,
                added_at TEXT NOT NULL,
                UNIQUE(user_id, ticker)
            );
            CREATE TABLE IF NOT EXISTS ticker_state (
                ticker TEXT PRIMARY KEY,
                price REAL NOT NULL,
                volume REAL NOT NULL,
                avg_volume REAL NOT NULL,
                volatility_5d REAL NOT NULL,
                volatility_30d REAL NOT NULL,
                fifty_two_week_high REAL NOT NULL,
                fifty_two_week_low REAL NOT NULL,
                updated_at TEXT NOT NULL,
                is_stale INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS user_snapshots (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                ticker TEXT NOT NULL,
                price_at_snapshot REAL NOT NULL,
                volume_at_snapshot REAL NOT NULL,
                volatility_at_snapshot REAL NOT NULL,
                snapshot_taken_at TEXT NOT NULL,
                PRIMARY KEY(user_id, ticker)
            );
            CREATE TABLE IF NOT EXISTS change_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                change_type TEXT NOT NULL,
                magnitude REAL NOT NULL,
                detected_at TEXT NOT NULL
            );
            """
        )
        if DATABASE_URL:
            connection.execute(schema.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY"))
        else:
            connection.executescript(schema)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return base64.urlsafe_b64encode(salt + digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    try:
        raw = base64.urlsafe_b64decode(encoded.encode())
        salt, expected = raw[:16], raw[16:]
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, base64.binascii.Error):
        return False


def token_for(user_id: int) -> str:
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(json.dumps({"sub": str(user_id), "exp": int(time.time()) + 60 * 60 * 24 * 7}).encode()).rstrip(b"=").decode()
    signature = hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    return f"{header}.{payload}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def user_from_token(token: str) -> int:
    try:
        header, payload, signature = token.split(".")
        expected = hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
        provided = base64.urlsafe_b64decode(signature + "===")
        data = json.loads(base64.urlsafe_b64decode(payload + "===").decode())
        if not hmac.compare_digest(expected, provided) or data["exp"] < time.time():
            raise ValueError
        return int(data["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, base64.binascii.Error) as error:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from error


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> int:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_from_token(credentials.credentials)


def price_for(ticker: str, fallback: float) -> float:
    return PRICE_BASES.get(ticker.upper(), fallback)


def ensure_ticker_state(connection: sqlite3.Connection, ticker: str) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM ticker_state WHERE ticker = ?", (ticker,)).fetchone()
    if row is None:
        price = price_for(ticker, 100.0)
        connection.execute(
            "INSERT INTO ticker_state (ticker, price, volume, avg_volume, volatility_5d, volatility_30d, fifty_two_week_high, fifty_two_week_low, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (ticker, price, 1_000_000, 1_000_000, 1.8, 2.4, round(price * 1.15, 2), round(price * 0.85, 2), now()),
        )
        row = connection.execute("SELECT * FROM ticker_state WHERE ticker = ?", (ticker,)).fetchone()
    return row


def ticker_json(row: sqlite3.Row) -> dict[str, Any]:
    payload = dict(row)
    payload["is_stale"] = bool(payload["is_stale"])
    return payload


def sparkline_for(ticker: str, price: float) -> list[float]:
    seed = sum(ord(character) for character in ticker)
    return [round(price * (1 + (((seed + index * 17) % 31) - 15) / 1000), 2) for index in range(30)]


def watchlist_item_json(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def digest_item(connection: sqlite3.Connection, user_id: int, item: sqlite3.Row) -> tuple[dict[str, Any], dict[str, float]]:
    state = ensure_ticker_state(connection, item["ticker"])
    snapshot = connection.execute(
        "SELECT * FROM user_snapshots WHERE user_id = ? AND ticker = ?", (user_id, item["ticker"])
    ).fetchone()
    current = ticker_json(state)
    changes: list[str] = []
    score = 0.0
    move_pct = 0.0
    z_score = 0.0
    volume_ratio = current["volume"] / max(current["avg_volume"], 1)
    regime_ratio = current["volatility_5d"] / max(current["volatility_30d"], 0.1)
    if snapshot:
        previous_price = snapshot["price_at_snapshot"]
        move_pct = ((current["price"] - previous_price) / previous_price) * 100 if previous_price else 0
        z_score = move_pct / max(current["volatility_30d"], 0.1)
        if abs(z_score) > 1.5:
            changes.append(f"{'Up' if move_pct >= 0 else 'Down'} {abs(move_pct):.2f}% — {abs(z_score):.1f}x its usual daily move")
            score += min(abs(z_score) * 25, 55)
        if volume_ratio > 2:
            changes.append(f"Volume {volume_ratio:.1f}x above average")
            score += min((volume_ratio - 1) * 12, 25)
        if regime_ratio > 1.5 or regime_ratio < 0.67:
            changes.append(f"Volatility regime shifted to {regime_ratio:.1f}x its 30-day level")
            score += 12
        breached = current["price"] >= current["fifty_two_week_high"] or current["price"] <= current["fifty_two_week_low"]
        if breached:
            changes.append("Price breached its tracked 52-week range")
            score += 20
    else:
        changes.append("Newly added — baseline captured on this visit")
    age = max(0, int(time.time() - datetime.fromisoformat(current["updated_at"]).timestamp()))
    return {
        **current,
        "id": item["id"],
        "attention_score": round(min(score, 100), 1),
        "changes": changes,
        "freshness_seconds": age,
        "change_pct": round(move_pct, 2),
        "z_score": round(z_score, 2),
        "volume_ratio": round(volume_ratio, 2),
        "sparkline": sparkline_for(item["ticker"], current["price"]),
    }, {"price": current["price"], "volume": current["volume"], "volatility": current["volatility_30d"]}


def holding_json(row: sqlite3.Row) -> dict[str, Any]:
    current = row["last_price"] * row["quantity"]
    gain_pct = ((row["last_price"] - row["buy_price"]) / row["buy_price"]) * 100
    return {**dict(row), "current_value": round(current, 2), "gain_pct": round(gain_pct, 2)}


def get_holdings(user_id: int) -> list[dict[str, Any]]:
    with db() as connection:
        rows = connection.execute("SELECT * FROM holdings WHERE user_id = ? ORDER BY (last_price * quantity) DESC", (user_id,)).fetchall()
    return [holding_json(row) for row in rows]


def score_portfolio(holdings: list[dict[str, Any]]) -> dict[str, Any]:
    if not holdings:
        return {"health_score": 0, "diversification_score": 0, "sector_score": 0, "balance_score": 0, "recommendations": ["Add holdings to generate a health score."]}
    total = sum(item["current_value"] for item in holdings)
    weights = [item["current_value"] / total for item in holdings]
    diversification = max(0, min(100, 100 * (1 - sum(weight * weight for weight in weights))))
    sectors: dict[str, float] = {}
    assets: dict[str, float] = {}
    for item in holdings:
        sectors[item["sector"]] = sectors.get(item["sector"], 0) + item["current_value"] / total
        assets[item["asset_type"]] = assets.get(item["asset_type"], 0) + item["current_value"] / total
    sector_penalty = sum(max(0, weight - 0.30) * 100 for weight in sectors.values())
    sector_score = max(0, min(100, 100 - sector_penalty))
    deviation = sum(abs(assets.get(asset, 0) - target) for asset, target in TARGET_MIX.items())
    balance_score = max(0, min(100, 100 - deviation * 100))
    health = 0.4 * diversification + 0.3 * sector_score + 0.3 * balance_score
    recommendations: list[str] = []
    for asset, target in TARGET_MIX.items():
        delta = assets.get(asset, 0) - target
        if abs(delta) > 0.10:
            direction = "Reduce" if delta > 0 else "Add"
            recommendations.append(f"{direction} {asset.upper()} allocation by {abs(delta) * 100:.0f}% (about ₹{abs(delta) * total:,.0f}).")
    for sector, weight in sectors.items():
        if weight > 0.40:
            recommendations.append(f"Reduce {sector} sector exposure by {(weight - 0.30) * 100:.0f}% to lower concentration risk.")
    return {"health_score": round(health, 1), "diversification_score": round(diversification, 1), "sector_score": round(sector_score, 1), "balance_score": round(balance_score, 1), "recommendations": recommendations}


def seed_holdings(user_id: int) -> None:
    demo = [("TCS", "stock", 8, 3_520), ("HDFCBANK", "stock", 12, 1_410), ("GOLDBEES", "gold", 80, 54), ("LIQUIDBEES", "debt", 25, 980)]
    with db() as connection:
        connection.executemany("INSERT INTO holdings (user_id, ticker, name, asset_type, sector, quantity, buy_price, last_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(user_id, ticker, DEFAULTS[ticker][0], asset, DEFAULTS[ticker][1], quantity, buy, price_for(ticker, buy), now()) for ticker, asset, quantity, buy in demo])


async def broadcast(message: dict[str, Any]) -> None:
    stale: list[WebSocket] = []
    with connections_lock:
        sockets = list(connections)
    for socket in sockets:
        try:
            await socket.send_json(message)
        except Exception:
            stale.append(socket)
    with connections_lock:
        for socket in stale:
            connections.discard(socket)


async def broadcast_watchlist(ticker: str, payload: dict[str, Any]) -> None:
    stale: list[WebSocket] = []
    with connections_lock:
        sockets = list(watch_connections.items())
    for socket, user_id in sockets:
        with db() as connection:
            watching = connection.execute(
                "SELECT 1 FROM watchlist_items WHERE user_id = ? AND ticker = ?", (user_id, ticker)
            ).fetchone()
        if watching:
            try:
                await socket.send_json({"type": "ticker_update", "payload": payload})
            except Exception:
                stale.append(socket)
    with connections_lock:
        for socket in stale:
            watch_connections.pop(socket, None)


async def price_loop() -> None:
    while True:
        await asyncio.sleep(30)
        with db() as connection:
            rows = connection.execute("SELECT id, ticker, last_price FROM holdings").fetchall()
            for row in rows:
                updated = round(row["last_price"] * (1 + secrets.choice([-1, 1]) * secrets.randbelow(8) / 10_000), 2)
                connection.execute("UPDATE holdings SET last_price = ? WHERE id = ?", (updated, row["id"]))
                await broadcast({"type": "price_update", "payload": {"ticker": row["ticker"], "last_price": updated}})
            tickers = connection.execute("SELECT DISTINCT ticker FROM watchlist_items").fetchall()
            for ticker_row in tickers:
                state = ensure_ticker_state(connection, ticker_row["ticker"])
                updated = round(state["price"] * (1 + secrets.choice([-1, 1]) * secrets.randbelow(20) / 10_000), 2)
                volume = round(state["avg_volume"] * (1 + secrets.randbelow(250) / 100), 0)
                connection.execute(
                    "UPDATE ticker_state SET price = ?, volume = ?, updated_at = ?, is_stale = 0 WHERE ticker = ?",
                    (updated, volume, now(), ticker_row["ticker"]),
                )
                await broadcast_watchlist(ticker_row["ticker"], {"ticker": ticker_row["ticker"], "price": updated, "volume": volume, "updated_at": now(), "is_stale": False})


@asynccontextmanager
async def lifespan(_: FastAPI):
    import asyncio
    init_db()
    task = asyncio.create_task(price_loop())
    yield
    task.cancel()


app = FastAPI(title="PulseFolio API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=FRONTEND_ORIGINS + ["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "PulseFolio API", "status": "ok", "health": "/health"}


@app.post("/auth/signup")
def signup(payload: AuthPayload) -> dict[str, str]:
    with db() as connection:
        try:
            cursor = connection.execute("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) RETURNING id", (payload.email.lower(), hash_password(payload.password), now()))
            user_id = cursor.fetchone()["id"]
        except (sqlite3.IntegrityError, psycopg.errors.UniqueViolation) as error:
            raise HTTPException(status_code=409, detail="An account with that email already exists") from error
    seed_holdings(user_id)
    return {"token": token_for(user_id)}


@app.post("/auth/login")
def login(payload: AuthPayload) -> dict[str, str]:
    with db() as connection:
        row = connection.execute("SELECT * FROM users WHERE email = ?", (payload.email.lower(),)).fetchone()
    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"token": token_for(row["id"])}


@app.get("/holdings")
def list_holdings(user_id: int = Depends(current_user)) -> list[dict[str, Any]]:
    return get_holdings(user_id)


@app.post("/holdings")
def create_holding(payload: HoldingPayload, user_id: int = Depends(current_user)) -> dict[str, Any]:
    ticker = payload.ticker.strip().upper()
    asset_type = payload.asset_type.lower()
    if asset_type not in ASSET_TYPES:
        raise HTTPException(status_code=422, detail="asset_type must be stock, mf, gold, or debt")
    name, sector = DEFAULTS.get(ticker, (ticker, "Other"))
    with db() as connection:
        cursor = connection.execute("INSERT INTO holdings (user_id, ticker, name, asset_type, sector, quantity, buy_price, last_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id", (user_id, ticker, name, asset_type, sector, payload.quantity, payload.buy_price, price_for(ticker, payload.buy_price), now()))
        row = connection.execute("SELECT * FROM holdings WHERE id = ?", (cursor.fetchone()["id"],)).fetchone()
    return holding_json(row)


@app.post("/holdings/import-csv")
async def import_csv(file: UploadFile = File(...), user_id: int = Depends(current_user)) -> list[dict[str, Any]]:
    raw = await file.read()
    try:
        decoded = raw.decode("utf-8-sig")
        dialect = csv.Sniffer().sniff(decoded[:4096], delimiters=",\t;")
        records = list(csv.DictReader(decoded.splitlines(), dialect=dialect))
    except (UnicodeDecodeError, csv.Error) as error:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 with ticker, asset_type, quantity, and buy_price columns") from error
    payloads: list[HoldingPayload] = []
    for record in records:
        try:
            normalized = {str(key).strip().lower(): (value.strip() if isinstance(value, str) else value) for key, value in record.items() if key is not None}
            payloads.append(HoldingPayload(ticker=normalized["ticker"], asset_type=normalized["asset_type"], quantity=float(normalized["quantity"]), buy_price=float(normalized["buy_price"])))
        except (KeyError, TypeError, ValueError) as error:
            raise HTTPException(status_code=400, detail="Each CSV row needs ticker, asset_type, quantity, and buy_price") from error
    created = []
    with db() as connection:
        for payload in payloads:
            ticker = payload.ticker.strip().upper()
            asset_type = payload.asset_type.lower()
            if asset_type not in ASSET_TYPES:
                raise HTTPException(status_code=422, detail="asset_type must be stock, mf, gold, or debt")
            name, sector = DEFAULTS.get(ticker, (ticker, "Other"))
            cursor = connection.execute("INSERT INTO holdings (user_id, ticker, name, asset_type, sector, quantity, buy_price, last_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id", (user_id, ticker, name, asset_type, sector, payload.quantity, payload.buy_price, price_for(ticker, payload.buy_price), now()))
            created.append(holding_json(connection.execute("SELECT * FROM holdings WHERE id = ?", (cursor.fetchone()["id"],)).fetchone()))
    return created


@app.delete("/holdings/{holding_id}", status_code=204, response_model=None)
def delete_holding(holding_id: int, user_id: int = Depends(current_user)) -> None:
    with db() as connection:
        result = connection.execute("DELETE FROM holdings WHERE id = ? AND user_id = ?", (holding_id, user_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Holding not found")


@app.get("/portfolio/summary")
def summary(user_id: int = Depends(current_user)) -> dict[str, Any]:
    holdings = get_holdings(user_id)
    total = sum(item["current_value"] for item in holdings)
    gain = sum((item["last_price"] - item["buy_price"]) * item["quantity"] for item in holdings)
    def allocation(key: str) -> dict[str, float]:
        return {label: round(sum(item["current_value"] for item in holdings if item[key] == label), 2) for label in sorted({item[key] for item in holdings})}
    top = sorted(holdings, key=lambda item: item["current_value"], reverse=True)[:8]
    return {"total_value": round(total, 2), "total_gain": round(gain, 2), "total_gain_pct": round(gain / (total - gain) * 100, 2) if total != gain else 0, "allocation_by_sector": allocation("sector"), "allocation_by_asset_type": allocation("asset_type"), "top_holdings": [{key: item[key] for key in ("ticker", "name", "current_value", "gain_pct")} for item in top]}


@app.get("/portfolio/health-score")
def health_score(user_id: int = Depends(current_user)) -> dict[str, Any]:
    return score_portfolio(get_holdings(user_id))


@app.get("/alerts")
def list_alerts(user_id: int = Depends(current_user)) -> list[dict[str, Any]]:
    with db() as connection:
        return [dict(row) for row in connection.execute("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()]


@app.post("/alerts")
def create_alert(payload: AlertPayload, user_id: int = Depends(current_user)) -> dict[str, Any]:
    if payload.direction not in {"above", "below"}:
        raise HTTPException(status_code=422, detail="direction must be above or below")
    with db() as connection:
        if connection.execute("SELECT id FROM holdings WHERE id = ? AND user_id = ?", (payload.holding_id, user_id)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Holding not found")
        cursor = connection.execute("INSERT INTO alerts (user_id, holding_id, threshold_price, direction, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id", (user_id, payload.holding_id, payload.threshold_price, payload.direction, now()))
        row = connection.execute("SELECT * FROM alerts WHERE id = ?", (cursor.fetchone()["id"],)).fetchone()
    return dict(row)


@app.delete("/alerts/{alert_id}", status_code=204, response_model=None)
def delete_alert(alert_id: int, user_id: int = Depends(current_user)) -> None:
    with db() as connection:
        result = connection.execute("DELETE FROM alerts WHERE id = ? AND user_id = ?", (alert_id, user_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Alert not found")


@app.get("/watchlist")
def list_watchlist(user_id: int = Depends(current_user)) -> list[dict[str, Any]]:
    with db() as connection:
        rows = connection.execute(
            "SELECT id, user_id, ticker, added_at FROM watchlist_items WHERE user_id = ? ORDER BY added_at DESC",
            (user_id,),
        ).fetchall()
        return [{**watchlist_item_json(row), "state": ticker_json(ensure_ticker_state(connection, row["ticker"]))} for row in rows]


@app.post("/watchlist")
def add_watchlist_item(payload: WatchlistPayload, user_id: int = Depends(current_user)) -> dict[str, Any]:
    ticker = payload.ticker.strip().upper()
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9._-]{0,23}", ticker):
        raise HTTPException(status_code=422, detail="Enter a valid ticker symbol")
    with db() as connection:
        ensure_ticker_state(connection, ticker)
        try:
            cursor = connection.execute(
                "INSERT INTO watchlist_items (user_id, ticker, added_at) VALUES (?, ?, ?) RETURNING id",
                (user_id, ticker, now()),
            )
        except (sqlite3.IntegrityError, psycopg.errors.UniqueViolation) as error:
            raise HTTPException(status_code=409, detail="That ticker is already on your watchlist") from error
        row = connection.execute("SELECT id, user_id, ticker, added_at FROM watchlist_items WHERE id = ?", (cursor.fetchone()["id"],)).fetchone()
        return {**watchlist_item_json(row), "state": ticker_json(ensure_ticker_state(connection, ticker))}


@app.delete("/watchlist/{item_id}", status_code=204, response_model=None)
def delete_watchlist_item(item_id: int, user_id: int = Depends(current_user)) -> None:
    with db() as connection:
        result = connection.execute("DELETE FROM watchlist_items WHERE id = ? AND user_id = ?", (item_id, user_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Watchlist item not found")


@app.get("/watchlist/digest")
def watchlist_digest(user_id: int = Depends(current_user)) -> dict[str, Any]:
    with db() as connection:
        items = connection.execute(
            "SELECT id, user_id, ticker, added_at FROM watchlist_items WHERE user_id = ? ORDER BY added_at DESC",
            (user_id,),
        ).fetchall()
        digest: list[dict[str, Any]] = []
        snapshots: list[tuple[int, str, float, float, float, str]] = []
        for item in items:
            current, snapshot_values = digest_item(connection, user_id, item)
            digest.append(current)
            snapshots.append((user_id, item["ticker"], snapshot_values["price"], snapshot_values["volume"], snapshot_values["volatility"], now()))
        connection.executemany(
            "INSERT INTO user_snapshots (user_id, ticker, price_at_snapshot, volume_at_snapshot, volatility_at_snapshot, snapshot_taken_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, ticker) DO UPDATE SET price_at_snapshot = excluded.price_at_snapshot, volume_at_snapshot = excluded.volume_at_snapshot, volatility_at_snapshot = excluded.volatility_at_snapshot, snapshot_taken_at = excluded.snapshot_taken_at",
            snapshots,
        )
    digest.sort(key=lambda item: item["attention_score"], reverse=True)
    return {"items": digest, "last_viewed_at": now()}


@app.websocket("/ws/live")
async def live_socket(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        user_from_token(token)
    except HTTPException:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    with connections_lock:
        connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        with connections_lock:
            connections.discard(websocket)


@app.websocket("/ws/watchlist")
async def watchlist_socket(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        user_id = user_from_token(token)
    except HTTPException:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    with connections_lock:
        watch_connections[websocket] = user_id
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        with connections_lock:
            watch_connections.pop(websocket, None)
