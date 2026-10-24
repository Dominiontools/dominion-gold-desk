
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "text/plain; charset=utf-8"
};

const REDIRECT_URI =
  "https://visionary-sprite-e05482.netlify.app/.netlify/functions/ctrader-callback";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors
    });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: cors
    });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return new Response(
      "cTrader authorization failed. Please try connecting again.",
      { status: 400, headers: cors }
    );
  }

  if (!code) {
    return new Response(
      "Missing authorization code. Start the cTrader connection process first.",
      { status: 400, headers: cors }
    );
  }

  const clientId = process.env.CTRADER_CLIENT_ID;
  const clientSecret = process.env.CTRADER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      "Missing cTrader application credentials in Netlify.",
      { status: 500, headers: cors }
    );
  }

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      client_secret: clientSecret
    });

    const res = await fetch(
      "https://openapi.ctrader.com/apps/token?" + params.toString(),
      {
        method: "GET",
        headers: { Accept: "application/json" }
      }
    );

    const data = await res.json();

    if (
      !res.ok ||
      !data.accessToken ||
      !data.refreshToken
    ) {
      console.error("cTrader token exchange failed:", {
        httpStatus: res.status,
        errorCode: data.errorCode || "UNKNOWN"
      });

      return new Response(
        "Token exchange failed. Check the cTrader app settings and redirect URI, then try connecting again.",
        { status: 400, headers: cors }
      );
    }

    const { getStore } = await import("@netlify/blobs");
    const store = getStore("ctrader");

    await store.setJSON("tokens", {
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expires_in: data.expiresIn,
      token_type: data.tokenType,
      saved_at: Date.now()
    });

    return new Response(
      "cTrader authorization succeeded. Tokens saved securely on the server.",
      { status: 200, headers: cors }
    );
  } catch (err) {
    console.error("cTrader callback failed:", err.message);

    return new Response(
      "Connection failed due to a server error. Check the Netlify function logs.",
      { status: 500, headers: cors }
    );
  }
};
