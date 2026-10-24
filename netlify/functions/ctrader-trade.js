import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

const ACCOUNT_ID = 49272140;
const RISK_USD = 2;
const STOP_LOSS_PIPS = 20;
const TAKE_PROFIT_PIPS = 40;

// EURUSD symbol ID on Pepperstone demo.
// We will confirm this with the symbols endpoint before live ordering.
const SYMBOL_ID = 1;

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(req.url);
  const confirm = url.searchParams.get("confirm") === "YES";
  const symbol = url.searchParams.get("symbol") || "EURUSD";
  const side = (url.searchParams.get("side") || "BUY").toUpperCase();

  if (!["BUY", "SELL"].includes(side)) {
    return new Response("side must be BUY or SELL", { status: 400, headers: cors });
  }

  try {
    const store = getStore("ctrader");
    const tokens = await store.get("tokens", { type: "json" });

    if (!tokens || !tokens.access_token) {
      return new Response("No cTrader tokens saved. Reconnect cTrader.", {
        status: 400,
        headers: cors
      });
    }

    if (!confirm) {
      return new Response(JSON.stringify({
        status: "PREVIEW_ONLY",
        accountId: ACCOUNT_ID,
        symbol,
        side,
        riskPerTradeUSD: RISK_USD,
        stopLossPips: STOP_LOSS_PIPS,
        takeProfitPips: TAKE_PROFIT_PIPS,
        message: "Add ?confirm=YES to place a real demo order."
      }, null, 2), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    // Minimum safe volume: 0.01 lot = 1,000,000 cent-lots.
    const volume = 1000000;

    const res = await fetch("https://api.ctrader.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + tokens.access_token,
        "Account-Id": String(ACCOUNT_ID)
      },
      body: JSON.stringify({
        symbolId: SYMBOL_ID,
        orderType: "MARKET",
        tradeSide: side,
        volume
      })
    });

    const data = await res.json();

    return new Response(JSON.stringify({
      status: res.ok ? "ORDER_SENT" : "ORDER_FAILED",
      response: data
    }, null, 2), {
      status: res.ok ? 200 : 400,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response("Error: " + error.message, {
      status: 500,
      headers: cors
    });
  }
};
