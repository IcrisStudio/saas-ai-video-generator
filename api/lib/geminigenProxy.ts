import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import FormData from "form-data";
import fs from "fs";
import { PassThrough } from "stream";

const GEMINIGEN_BASE_URL = "https://api.geminigen.ai/uapi/v1";

export type ProxyOptions = { bodyParserDisabled?: boolean };

/**
 * Parse multipart request with formidable and proxy to GeminiGen API.
 * Call this from handlers that set api: { bodyParser: false }.
 */
export async function proxyMultipartToGeminigen(
  req: VercelRequest,
  res: VercelResponse,
  targetPath: string
): Promise<VercelResponse | void> {
  const sendError = (status: number, msg: string) => {
    try {
      res.status(status).setHeader("Content-Type", "application/json").json({ error: msg });
    } catch (_) {}
  };
  try {
    const apiKey = process.env.GEMINIGEN_API_KEY;
    if (!apiKey) {
      return sendError(500, "GEMINIGEN_API_KEY not configured");
    }

    const targetUrl = `${GEMINIGEN_BASE_URL}/${targetPath.replace(/^\//, "")}`;
    const form = new formidable.IncomingForm({ maxFileSize: 50 * 1024 * 1024 });
    let fields: Record<string, string[]>;
    let files: Record<string, formidable.File[]>;

    try {
      [fields, files] = await form.parse(req as unknown as import("http").IncomingMessage);
    } catch (err) {
      console.error("[geminigen proxy] parse error", err);
      return sendError(400, "Failed to parse form data");
    }

    if (!fields || typeof fields !== "object") fields = {};
    if (!files || typeof files !== "object") files = {};

    const out = new FormData();
    const isImageGen = targetPath.includes("generate_image");

    const appendField = async (key: string, val: string) => {
    if (typeof val === "string" && val.startsWith("http")) {
      try {
        const imgRes = await fetch(val);
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const ext = imgRes.headers.get("content-type")?.split("/")[1] || "jpg";
          out.append("files", buffer, {
            filename: `ref_${Math.random().toString(36).slice(2)}.${ext}`,
            contentType: imgRes.headers.get("content-type") || "image/jpeg",
          });
          return;
        }
      } catch (e) {
        console.error("[Proxy] Failed to fetch image URL:", val, e);
      }
    }
    out.append(key, val);
  };

  for (const key in fields) {
    const values = fields[key] || [];
    for (const val of values) {
      if (isImageGen && key === "file_urls" && typeof val === "string" && val.startsWith("http")) {
        out.append(key, val);
      } else {
        await appendField(key, val);
      }
    }
  }

  for (const key in files) {
    const list = files[key] || [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const filepath = file?.filepath;
      if (!filepath) continue;
      try {
        if (!fs.existsSync(filepath)) continue;
        const buffer = fs.readFileSync(filepath);
        const ext = (file.mimetype?.split("/")[1] || file.originalFilename?.split(".").pop()) || "png";
        out.append("files", buffer, {
          filename: `upload_${Date.now()}_${i}.${ext}`,
          contentType: file.mimetype || "image/png",
        });
      } finally {
        try {
          if (filepath && fs.existsSync(filepath)) fs.unlinkSync(filepath);
        } catch (_) {}
      }
    }
  }

  try {
    const headers = { ...out.getHeaders(), "x-api-key": apiKey };
    const bodyBuffer = await streamToBuffer(out);
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: bodyBuffer,
    });

    const text = await response.text();
    let data: object;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { error_message: text || `HTTP ${response.status} from API` };
    }

    if (!response.ok) {
      console.error("[GeminiGen Error]", response.status, targetUrl, text);
    }
    return res.status(response.status).json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Proxy failed";
    console.error("[geminigen proxy]", error);
    return sendError(500, message);
  }
  } catch (outer: unknown) {
    const msg = outer instanceof Error ? outer.message : "Proxy failed";
    console.error("[geminigen proxy] outer", outer);
    return sendError(500, msg);
  }
}

function streamToBuffer(stream: FormData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pt = new PassThrough();
    pt.on("data", (chunk: Buffer) => chunks.push(chunk));
    pt.on("end", () => resolve(Buffer.concat(chunks)));
    pt.on("error", reject);
    stream.pipe(pt);
  });
}
