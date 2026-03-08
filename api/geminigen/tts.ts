import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINIGEN_BASE_URL = "https://api.geminigen.ai/uapi/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.GEMINIGEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });
    }

    const response = await fetch(`${GEMINIGEN_BASE_URL}/tts-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(req.body || {}),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "TTS proxy failed";
    console.error("[geminigen/tts]", e);
    return res.status(500).json({ error: message });
  }
}
