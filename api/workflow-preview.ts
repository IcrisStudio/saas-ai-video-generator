import type { VercelRequest, VercelResponse } from "@vercel/node";
import { uploadToR2, isR2Configured } from "./lib/r2";

export const config = {
  api: { bodyParser: false },
};

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const r = req as NodeJS.ReadableStream & { on?: (e: string, cb: (chunk: Buffer) => void) => void };
    if (typeof r.on !== "function") {
      reject(new Error("Request stream not readable"));
      return;
    }
    r.on("data", (chunk: Buffer) => chunks.push(chunk));
    r.on("end", () => resolve(Buffer.concat(chunks)));
    r.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!isR2Configured()) {
    return res.status(503).json({ error: "R2 storage is not configured." });
  }

  try {
    const projectId = (req.headers["x-project-id"] as string)?.trim();
    if (!projectId) {
      return res.status(400).json({ error: "Missing x-project-id header" });
    }

    let body: Buffer;
    const rawBody = (req as unknown as { body?: Buffer }).body;
    if (Buffer.isBuffer(rawBody)) {
      body = rawBody;
    } else {
      body = await getRawBody(req);
    }
    if (!body || body.length === 0) {
      return res.status(400).json({ error: "No image body" });
    }

    const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_") || "project";
    const key = `workflows/${safeId}/preview.jpg`;

    const { url } = await uploadToR2(body, { key, contentType: "image/jpeg" });

    if (!url || !url.includes("/")) {
      return res.status(500).json({ error: "Invalid preview URL" });
    }

    return res.status(200).json({ previewUrl: url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Preview upload failed";
    console.error("[R2 workflow-preview]", e);
    return res.status(500).json({ error: message });
  }
}
