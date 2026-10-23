import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const store = getStore("ctrader");
    await store.delete("tokens");

    return new Response(
      "cTrader connection reset. Now open the main website and press Connect cTrader again.",
      { status: 200, headers: cors }
    );
  } catch (error) {
    return new Response("Error: " + error.message, {
      status: 500,
      headers: cors
    });
  }
};
