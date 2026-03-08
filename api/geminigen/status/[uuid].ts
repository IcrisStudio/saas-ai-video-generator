import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINIGEN_BASE_URL = "https://api.geminigen.ai/uapi/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    let uuid = req.query.uuid as string | undefined;
    if (!uuid && typeof req.url === "string") {
      const match = req.url.match(/\/api\/geminigen\/status\/([^/?#]+)/);
      if (match) uuid = match[1];
    }
    if (!uuid) {
      return res.status(400).json({ error: "uuid required" });
    }

    const apiKey = process.env.GEMINIGEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });
    }

    const response = await fetch(`${GEMINIGEN_BASE_URL}/history/${uuid}`, {
      method: "GET",
      headers: { "x-api-key": apiKey },
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Status check failed";
    console.error("[geminigen/status]", e);
    return res.status(500).json({ error: message });
  }
}
