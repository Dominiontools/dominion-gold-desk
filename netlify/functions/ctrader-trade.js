import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const ACCOUNT_ID = 49272140;
const RISK_USD = 2;
const STOP_LOSS_PIPS = 20;
const TAKE_PROFIT_PIPS = 40;

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response("Use POST", { status: 405, headers: cors });
  }

  try {
    const body = await req.json();
    const symbol = body.symbol || "EURUSD";
    const side = (body.side || "BUY").toUpperCase();

    if (!["BUY", "SELL"].includes(side)) {
      return new Response("side must be BUY or SELL", { status: 400, headers: cors });
    }

    const store = getStore("ctrader");
    const tokens = await store.get("tokens", { type: "json" });

    if (!tokens || !tokens.access_token) {
      return new Response("No cTrader tokens saved. Reconnect cTrader.", {
        status: 400,
        headers: cors
      });
    }

    return new Response(JSON.stringify({
      status: "TRADE_SETTINGS_READY",
      accountId: ACCOUNT_ID,
      accountNumber: 5363016,
      symbol,
      side,
      riskPerTradeUSD: RISK_USD,
      stopLossPips: STOP_LOSS_PIPS,
      takeProfitPips: TAKE_PROFIT_PIPS,
      rewardRiskRatio: "1:2",
      accessTokenFound: true
    }, null, 2), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response("Error: " + error.message, {
      status: 500,
      headers: cors
    });
  }
};
