import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Proxy for R2 workflow JSON (avoids CORS: browser fetches same-origin, server fetches R2).
 * Used when loading nodes.json / edges.json from R2 public URL in the Flow page.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const url = typeof req.query.url === "string" ? req.query.url : null;
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ error: "Invalid url" });
    }

    const r2Public = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
    if (!r2Public || !url.startsWith(r2Public + "/")) {
      return res.status(400).json({ error: "URL must be from R2 bucket" });
    }

    const response = await fetch(url, {
      headers: { Accept: "application/json, text/plain, */*" },
    });

    if (!response.ok) {
      return res.status(response.status).send(response.statusText);
    }

    const contentType = response.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store, no-cache");

    const text = await response.text();
    return res.send(text);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Proxy failed";
    console.error("[proxy-workflow]", e);
    return res.status(500).json({ error: message });
  }
}
