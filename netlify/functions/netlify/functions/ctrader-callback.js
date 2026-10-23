export async function handler(event) {
  const code = event.queryStringParameters?.code;
  const redirect = "https://comforting-alfajores-bf799b.netlify.app";
  if (!code)
    return { statusCode: 400, body: "Missing cTrader authorization code." };
  const r = await fetch("https://openapi.ctrader.com/apps/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect,
      client_id: process.env.CTRADER_CLIENT_ID,
      client_secret: process.env.CTRADER_CLIENT_SECRET,
    }),
  });
  const t = await r.json();
  if (!t.access_token)
    return { statusCode: 400, body: "cTrader did not return an access token." };
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<html><body style="font-family:sans-serif;background:#0e1923;color:#e8edf1;padding:30px"><h2>Dominion Gold Signal Desk</h2><p>cTrader connected successfully.</p><textarea style="width:100%;height:120px">${t.access_token}</textarea></body></html>`,
  };
}
