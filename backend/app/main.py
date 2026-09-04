from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.getenv("DATABASE_PATH", str(ROOT / "pulsefolio.db")))
JWT_SECRET = os.getenv("JWT_SECRET", "local-development-secret-change-me")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")

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


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as connection:
        connection.executescript(
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
            """
        )


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


async def price_loop() -> None:
    while True:
        await __import__("asyncio").sleep(30)
        with db() as connection:
            rows = connection.execute("SELECT id, ticker, last_price FROM holdings").fetchall()
            for row in rows:
                updated = round(row["last_price"] * (1 + secrets.choice([-1, 1]) * secrets.randbelow(8) / 10_000), 2)
                connection.execute("UPDATE holdings SET last_price = ? WHERE id = ?", (updated, row["id"]))
                await broadcast({"type": "price_update", "payload": {"ticker": row["ticker"], "last_price": updated}})


@asynccontextmanager
async def lifespan(_: FastAPI):
    import asyncio
    init_db()
    task = asyncio.create_task(price_loop())
    yield
    task.cancel()


app = FastAPI(title="PulseFolio API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/signup")
def signup(payload: AuthPayload) -> dict[str, str]:
    with db() as connection:
        try:
            cursor = connection.execute("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)", (payload.email.lower(), hash_password(payload.password), now()))
            user_id = cursor.lastrowid
        except sqlite3.IntegrityError as error:
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
        cursor = connection.execute("INSERT INTO holdings (user_id, ticker, name, asset_type, sector, quantity, buy_price, last_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (user_id, ticker, name, asset_type, sector, payload.quantity, payload.buy_price, price_for(ticker, payload.buy_price), now()))
        row = connection.execute("SELECT * FROM holdings WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return holding_json(row)


@app.post("/holdings/import-csv")
async def import_csv(file: UploadFile = File(...), user_id: int = Depends(current_user)) -> list[dict[str, Any]]:
    raw = await file.read()
    try:
        records = list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))
    except (UnicodeDecodeError, csv.Error) as error:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 with ticker, asset_type, quantity, and buy_price columns") from error
    created = []
    for record in records:
        try:
            created.append(create_holding(HoldingPayload(ticker=record["ticker"], asset_type=record["asset_type"], quantity=float(record["quantity"]), buy_price=float(record["buy_price"])), user_id))
        except (KeyError, ValueError) as error:
            raise HTTPException(status_code=400, detail="Each CSV row needs ticker, asset_type, quantity, and buy_price") from error
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
        cursor = connection.execute("INSERT INTO alerts (user_id, holding_id, threshold_price, direction, created_at) VALUES (?, ?, ?, ?, ?)", (user_id, payload.holding_id, payload.threshold_price, payload.direction, now()))
        row = connection.execute("SELECT * FROM alerts WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.delete("/alerts/{alert_id}", status_code=204, response_model=None)
def delete_alert(alert_id: int, user_id: int = Depends(current_user)) -> None:
    with db() as connection:
        result = connection.execute("DELETE FROM alerts WHERE id = ? AND user_id = ?", (alert_id, user_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Alert not found")


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
