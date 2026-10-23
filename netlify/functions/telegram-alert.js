export async function handler(event) {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };
  let signal = "WAIT",
    reason = "";
  try {
    const d = JSON.parse(event.body || "{}");
    signal = d.signal || "WAIT";
    reason = d.reason || "";
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  if (signal === "WAIT")
    return { statusCode: 200, body: JSON.stringify({ ok: true, sent: false }) };
  const token = process.env.TELEGRAM_BOT_TOKEN,
    chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId)
    return { statusCode: 500, body: "Missing Telegram variables" };
  const msg = "Dominion Gold Signal Desk\n" + signal + " signal\n\n" + reason;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: msg }),
  });
  const j = await r.json();
  return { statusCode: 200, body: JSON.stringify({ ok: j.ok }) };
}
