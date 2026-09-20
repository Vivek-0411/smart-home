// Vercel serverless function: /api/blynk
// Keeps the real BLYNK_AUTH_TOKEN on the server. The browser never sees it.
// The browser instead sends a shared APP_SECRET header, checked below.

export default async function handler(req, res) {
  const APP_SECRET = process.env.APP_SECRET;
  const BLYNK_TOKEN = process.env.BLYNK_TOKEN;

  const clientSecret = req.headers["x-app-secret"];
  if (!APP_SECRET || clientSecret !== APP_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!BLYNK_TOKEN) {
    return res.status(500).json({ error: "BLYNK_TOKEN not configured on server" });
  }

  const { action, pin, value } = req.query;

  if (!action || !pin) {
    return res.status(400).json({ error: "Missing action or pin" });
  }

  let url;
  if (action === "get") {
    url = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${pin}`;
  } else if (action === "update") {
    if (value === undefined) {
      return res.status(400).json({ error: "Missing value for update" });
    }
    url = `https://blynk.cloud/external/api/update?token=${BLYNK_TOKEN}&${pin}=${encodeURIComponent(value)}`;
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    const blynkRes = await fetch(url);
    const text = await blynkRes.text();
    res.status(blynkRes.status).send(text);
  } catch (e) {
    res.status(502).json({ error: "Blynk request failed", detail: String(e) });
  }
}
