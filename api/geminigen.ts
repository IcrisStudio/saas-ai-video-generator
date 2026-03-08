import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMultipartToGeminigen } from "./lib/geminigenProxy";

export const config = {
  api: { bodyParser: false },
};

const GEMINIGEN_BASE_URL = "https://api.geminigen.ai/uapi/v1";

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const r = req as unknown as { on?: (e: string, cb: (chunk: Buffer) => void) => void };
    if (typeof r.on !== "function") {
      reject(new Error("Request stream not readable"));
      return;
    }
    const chunks: Buffer[] = [];
    r.on("data", (chunk: Buffer) => chunks.push(chunk));
    r.on("end", () => resolve(Buffer.concat(chunks)));
    r.on("error", reject);
  });
}

/** Resolve target path for GeminiGen API from X-Geminigen-Target header or query */
function getTargetPath(target: string | undefined): string | null {
  if (!target || typeof target !== "string") return null;
  const t = target.trim().toLowerCase();
  if (t === "image") return "generate_image";
  if (t === "text") return "text_generation";
  if (t === "tts") return "tts-text";
  if (t === "video-gen/veo") return "video-gen/veo";
  if (t === "video-gen/sora") return "video-gen/sora";
  if (t === "video-gen/grok") return "video-gen/grok";
  if (t === "video-extend/veo") return "video-extend/veo";
  if (t === "video-extend/grok") return "video-extend/grok";
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const method = req.method || "";
    const targetHeader = (req.headers["x-geminigen-target"] as string)?.trim();
    const targetQuery = (req.query.target as string)?.trim();
    const uuidQuery = (req.query.uuid as string)?.trim();

    // GET /api/geminigen?target=status&uuid=xxx
    if (method === "GET" && (targetQuery === "status" || targetHeader === "status")) {
      const uuid = uuidQuery || (req.headers["x-geminigen-uuid"] as string)?.trim();
      if (!uuid) return res.status(400).json({ error: "uuid required for status" });
      const apiKey = process.env.GEMINIGEN_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });
      const response = await fetch(`${GEMINIGEN_BASE_URL}/history/${uuid}`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    if (method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const target = targetHeader || targetQuery;

    // POST with X-Geminigen-Target: tts — JSON body
    if (target === "tts") {
      const apiKey = process.env.GEMINIGEN_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });
      const raw = await getRawBody(req);
      let body: object = {};
      try {
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch (_) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
      const response = await fetch(`${GEMINIGEN_BASE_URL}/tts-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // POST multipart: image, text, video-gen/*, video-extend/*
    const targetPath = getTargetPath(target);
    if (!targetPath || targetPath === "tts-text") {
      return res.status(400).json({ error: "Missing or invalid X-Geminigen-Target header (e.g. image, text, video-gen/veo)" });
    }
    return proxyMultipartToGeminigen(req, res, targetPath);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[geminigen]", e);
    return res.status(500).json({ error: message });
  }
}
