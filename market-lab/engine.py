#!/usr/bin/env python3
"""A $20 PAPER-only momentum experiment. Never places actual orders."""
from __future__ import annotations

import csv
import io
import json
import os
import sys
import tempfile
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = HERE / "state.json"
REPORT = HERE / "report.json"
STARTING_CASH = 20.0
SLIPPAGE = 0.0015
SYMBOL = "SPY.US"


def average(values):
    return sum(values) / len(values) if values else 0.0


def target(closes):
    """One simple rule: own SPY when SMA(20) > SMA(50); otherwise cash."""
    if len(closes) < 50:
        return None
    return average(closes[-20:]) > average(closes[-50:])


def retrieve_yahoo(today):
    """Yahoo's keyless daily chart JSON: unofficial and may rate-limit."""
    url = ("https://query1.finance.yahoo.com/v8/finance/chart/SPY"
           "?range=2y&interval=1d&events=history")
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; MarketLabPaper/1.0)",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=12) as response:
        payload = json.loads(response.read(1_000_000))
    chart = payload["chart"]["result"][0]
    dates = chart["timestamp"]
    quote = chart["indicators"]["quote"][0]
    rows = []
    for t, op, cl in zip(dates, quote["open"], quote["close"]):
        if op is None or cl is None:
            continue
        d = datetime.fromtimestamp(t, timezone.utc).date()
        if op > 0 and cl > 0 and d <= today:
            rows.append({"date": d.isoformat(),
                         "open": float(op), "close": float(cl)})
    return rows


def retrieve_stooq(today):
    """Backup CSV provider, when its anti-bot controls permit access."""
    begin = today - timedelta(days=410)
    url = (f"https://stooq.com/q/d/l/?s=spy.us&i=d"
           f"&d1={begin:%Y%m%d}&d2={today:%Y%m%d}")
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; MarketLabPaper/1.0)",
        "Accept": "text/csv",
    })
    with urllib.request.urlopen(req, timeout=8) as response:
        body = response.read(500_000).decode("utf-8-sig")
    rows = []
    for row in csv.DictReader(io.StringIO(body)):
        try:
            d = date.fromisoformat(row["Date"])
            opening = float(row["Open"])
            closing = float(row["Close"])
            if opening > 0 and closing > 0 and d <= today:
                rows.append({"date": d.isoformat(),
                             "open": opening, "close": closing})
        except (ValueError, KeyError, TypeError):
            continue
    return rows


def retrieve_prices(today=None):
    today = today or date.today()
    errors = []
    for name, provider in (("Yahoo", retrieve_yahoo),
                           ("Stooq", retrieve_stooq)):
        try:
            rows = provider(today)
            rows.sort(key=lambda x: x["date"])
            if len(rows) < 55:
                raise ValueError("less than 55 valid price rows")
            if (today - date.fromisoformat(rows[-1]["date"])).days > 7:
                raise ValueError("latest bar is more than 7 days old")
            return rows
        except Exception as exc:
            errors.append(name + ": " + str(exc)[:100])
    raise RuntimeError("Both data feeds failed: " + "; ".join(errors))


def initial_state(row, closes):
    return {
        "version": 1,
        "starting_cash": STARTING_CASH,
        "cash": STARTING_CASH,
        "shares": 0.0,
        "first_close": row["close"],
        "first_date": row["date"],
        "last_processed": row["date"],
        "pending_target": target(closes),
        "trades": [],
        "history": [{
            "date": row["date"],
            "portfolio": STARTING_CASH,
            "benchmark": STARTING_CASH,
            "close": row["close"],
        }],
    }


def step(state, row, closes):
    """Trade at NEXT session's open from PREVIOUS session's closing signal."""
    instruction = state.get("pending_target")
    opening = row["open"]
    if instruction is True and state["cash"] > 1e-8:
        price = opening * (1 + SLIPPAGE)
        shares = state["cash"] / price
        state["trades"].append({"date": row["date"], "side": "BUY",
                                "price": round(price, 4),
                                "shares": round(shares, 8),
                                "simulation_only": True})
        state["shares"] += shares
        state["cash"] = 0.0
    elif instruction is False and state["shares"] > 1e-8:
        price = opening * (1 - SLIPPAGE)
        shares = state["shares"]
        state["cash"] += shares * price
        state["trades"].append({"date": row["date"], "side": "SELL",
                                "price": round(price, 4),
                                "shares": round(shares, 8),
                                "simulation_only": True})
        state["shares"] = 0.0

    state["pending_target"] = target(closes)
    state["last_processed"] = row["date"]
    state["history"].append({
        "date": row["date"],
        "portfolio": round(state["cash"] + state["shares"] * row["close"], 6),
        "benchmark": round(STARTING_CASH * row["close"] / state["first_close"], 6),
        "close": row["close"],
    })


def run_market(state, prices):
    if state is None:
        last = prices[-1]
        return initial_state(last, [r["close"] for r in prices])
    if state.get("version") != 1 or state.get("starting_cash") != STARTING_CASH:
        raise ValueError("State version or starting balance mismatch")
    last_day = state["last_processed"]
    for i, row in enumerate(prices):
        if row["date"] > last_day:
            step(state, row, [r["close"] for r in prices[:i+1]])
    return state


def max_drawdown(history):
    peak = 0.0
    worst = 0.0
    for item in history:
        value = item["portfolio"]
        peak = max(peak, value)
        if peak:
            worst = min(worst, value / peak - 1)
    return 100.0 * worst


def make_report(state, data_status="ok", error=None):
    hist = state["history"] if state else []
    latest = hist[-1] if hist else None
    portfolio = latest["portfolio"] if latest else STARTING_CASH
    return {
        "title": "Market Lab — paper trading only",
        "status": data_status,
        "error": error,
        "updated_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "symbol": SYMBOL,
        "starting_virtual_dollars": STARTING_CASH,
        "current_virtual_dollars": round(portfolio, 4),
        "virtual_profit_dollars": round(portfolio - STARTING_CASH, 4),
        "virtual_return_percent": round((portfolio / STARTING_CASH - 1) * 100, 3),
        "benchmark_virtual_dollars": latest["benchmark"] if latest else STARTING_CASH,
        "max_drawdown_percent": round(max_drawdown(hist), 3),
        "days_observed": len(hist),
        "as_of_market_date": latest["date"] if latest else None,
        "current_position": "SPY" if state and state["shares"] > 0 else "cash",
        "next_session_instruction": (
            "hold SPY" if state and state.get("pending_target") is True
            else "hold cash" if state and state.get("pending_target") is False
            else "insufficient history"
        ),
        "strategy": "20/50-day simple moving average; prior-close signal executes next open",
        "estimated_slippage_each_trade_percent": 0.15,
        "history": hist[-180:],
        "trades": state["trades"][-25:] if state else [],
        "real_money_invested": 0,
        "real_money_earned": 0,
        "disclaimer": (
            "SIMULATION. No brokerage connection, no real trades, "
            "no returns or future income guaranteed. Observed results "
            "start on the first actual run, never retroactively."
        ),
    }


def save_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent,
                                     prefix=".tmp-", delete=False) as stream:
        json.dump(payload, stream, indent=2, allow_nan=False)
        stream.write("\n")
        temporary = stream.name
    os.replace(temporary, path)


def main():
    previous = json.loads(STATE.read_text("utf-8")) if STATE.exists() else None
    try:
        prices = retrieve_prices()
        state = run_market(previous, prices)
        save_json(STATE, state)
        report = make_report(state)
    except Exception as exc:
        print("Market data update failed:", str(exc), file=sys.stderr)
        report = make_report(previous, data_status="data_unavailable",
                             error=str(exc)[:200])
    save_json(REPORT, report)
    print(json.dumps({k: report[k] for k in (
        "status", "as_of_market_date", "current_virtual_dollars",
        "real_money_earned")}, indent=2))
    return 0 if report["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())
