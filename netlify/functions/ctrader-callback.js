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

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing cTrader authorization code.", {
      status: 400,
      headers: cors
    });
  }

  const clientId = process.env.CTRADER_CLIENT_ID;
  const clientSecret = process.env.CTRADER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response("Missing cTrader environment variables.", {
      status: 500,
      headers: cors
    });
  }

  const redirectUri =
    "https://comforting-alfajores-bf799b.netlify.app/.netlify/functions/ctrader-callback";

  try {
    const tokenResponse = await fetch(
      "https://openapi.ctrader.com/apps/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return new Response(
        "cTrader did not return an access token. Details: " +
          JSON.stringify(tokenData),
        { status: 400, headers: cors }
      );
    }

    const store = getStore("ctrader");

    await store.setJSON("tokens", {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      saved_at: new Date().toISOString()
    });

    return new Response(
      "cTrader connected successfully. Tokens saved.",
      { status: 200, headers: cors }
    );
  } catch (error) {
    return new Response("cTrader connection failed: " + error.message, {
      status: 500,
      headers: cors
    });
  }
};
