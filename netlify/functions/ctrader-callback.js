const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

export default async (req) => {
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.hostname}`;

  const redirectUri =
    origin + "/.netlify/functions/ctrader-callback";

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response("cTrader error: " + error, {
      status: 400,
      headers: cors
    });
  }

  if (!code) {
    return new Response("Missing authorization code.", {
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

  try {
    const tokenUrl =
      "https://openapi.ctrader.com/apps/token" +
      "?grant_type=authorization_code" +
      "&code=" + encodeURIComponent(code) +
      "&redirect_uri=" + encodeURIComponent(redirectUri) +
      "&client_id=" + encodeURIComponent(clientId) +
      "&client_secret=" + encodeURIComponent(clientSecret);

    const res = await fetch(tokenUrl);
    const data = await res.json();

    if (!data.access_token) {
      return new Response(
        "Did not return an access token. Details: " + JSON.stringify(data),
        { status: 400, headers: cors }
      );
    }

    const { getStore } = await import("@netlify/blobs");
    const store = getStore("ctrader");

    await store.setJSON("tokens", {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      saved_at: Date.now()
    });

    return new Response(
      "cTrader connected successfully. Tokens saved.",
      { status: 200, headers: cors }
    );
  } catch (err) {
    return new Response("Error: " + err.message, {
      status: 500,
      headers: cors
    });
  }
};
