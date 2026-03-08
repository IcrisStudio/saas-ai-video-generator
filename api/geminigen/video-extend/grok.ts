import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMultipartToGeminigen } from "../../lib/geminigenProxy";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    return proxyMultipartToGeminigen(req, res, "video-extend/grok");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[geminigen/video-extend/grok]", e);
    return res.status(500).json({ error: message });
  }
}
