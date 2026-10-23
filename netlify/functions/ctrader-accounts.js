import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
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

    const res = await fetch(
      "https://api.spotware.com/connect/tradingaccounts?access_token=" +
        tokens.access_token
    );

    const data = await res.json();

    return new Response(JSON.stringify(data, null, 2), {
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
