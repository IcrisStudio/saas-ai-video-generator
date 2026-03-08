import "./server/loadEnv";
import express from "express";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";
import multer from "multer";
import FormData from "form-data";
import { uploadToR2, isR2Configured } from "./server/r2Upload";
import { groqChat } from "./server/groq";

const upload = multer();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Helper to proxy multipart requests
  const proxyMultipart = async (req: any, res: any, targetUrl: string) => {
    try {
      const apiKey = process.env.GEMINIGEN_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });

      const form = new FormData();

      // Helper to handle adding to form, fetching URLs if needed
      const appendField = async (key: string, val: any) => {
        if (typeof val === 'string' && val.startsWith('http')) {
          try {
            const imgRes = await fetch(val);
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer();
              const ext = imgRes.headers.get('content-type')?.split('/')[1] || 'jpg';
              // Binary data MUST go to 'files' per GeminiGen API docs
              form.append('files', Buffer.from(buffer), {
                filename: `ref_${Math.random().toString(36).slice(2)}.${ext}`,
                contentType: imgRes.headers.get('content-type') || 'image/jpeg'
              });
              return;
            }
          } catch (e) {
            console.error(`[Proxy] Failed to fetch image URL: ${val}`, e);
          }
        }

        // If it's a UUID or just a plain field, append as is
        // Note: We don't change the key here because if it's not a URL, it's a text param
        form.append(key, val);
      };

      // Add text fields (and fetch URLs)
      const isImageGen = targetUrl.endsWith('/generate_image');

      for (const key in req.body) {
        let values = req.body[key];

        // Ensure keys like file_urls and ref_images are always treated as arrays for the loop
        if (!Array.isArray(values) && (key === 'file_urls' || key === 'ref_images' || key === 'files')) {
          values = [values];
        }

        if (Array.isArray(values)) {
          for (const val of values) {
            // For image generation, GeminiGen prefers direct URL strings for file_urls
            if (isImageGen && key === 'file_urls' && typeof val === 'string' && val.startsWith('http')) {
              form.append(key, val);
            } else {
              await appendField(key, val);
            }
          }
        } else {
          // Single value path
          if (isImageGen && key === 'file_urls' && typeof values === 'string' && values.startsWith('http')) {
            form.append(key, values);
          } else {
            await appendField(key, values);
          }
        }
      }

      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any, index: number) => {
          const ext = file.mimetype?.split('/')[1] || 'png';
          // Use a unique name even if frontend provided one
          form.append('files', file.buffer, {
            filename: `upload_${Date.now()}_${index}.${ext}`,
            contentType: file.mimetype || 'image/png'
          });
        });
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          ...form.getHeaders(),
          "x-api-key": apiKey,
        },
        body: form,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error_message: text || `HTTP ${response.status} from API` };
      }

      if (!response.ok) {
        console.error(`[GeminiGen Error] ${response.status} from ${targetUrl}:`, text);
      }
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  };

  // Geminigen Proxy Endpoints
  const GEMINIGEN_BASE_URL = "https://api.geminigen.ai/uapi/v1";

  app.post("/api/geminigen/image", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/generate_image`);
  });

  // Video generation — model-specific endpoints
  app.post("/api/geminigen/video-gen/veo", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/video-gen/veo`);
  });

  app.post("/api/geminigen/video-gen/sora", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/video-gen/sora`);
  });

  app.post("/api/geminigen/video-gen/grok", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/video-gen/grok`);
  });

  // Video extend endpoints
  app.post("/api/geminigen/video-extend/veo", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/video-extend/veo`);
  });

  app.post("/api/geminigen/video-extend/grok", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/video-extend/grok`);
  });

  app.post("/api/geminigen/text", upload.any(), (req, res) => {
    proxyMultipart(req, res, `${GEMINIGEN_BASE_URL}/text_generation`);
  });

  app.post("/api/geminigen/tts", async (req, res) => {
    try {
      const apiKey = process.env.GEMINIGEN_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });

      const response = await fetch(`${GEMINIGEN_BASE_URL}/tts-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for R2 workflow JSON (avoids CORS: browser fetches same-origin, server fetches R2)
  app.get("/api/proxy-workflow", async (req, res) => {
    const url = req.query.url as string;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return res.status(400).json({ error: "Invalid url" });
    }
    const r2Public = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!r2Public || !url.startsWith(r2Public + "/")) {
      return res.status(400).json({ error: "URL must be from R2 bucket" });
    }
    try {
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
      res.send(text);
    } catch (e: any) {
      console.error("[Proxy workflow]", e);
      res.status(500).json({ error: e.message || "Proxy failed" });
    }
  });

  // Proxy for media URLs - API CDN often returns 403 when fetched from Convex server
  app.get("/api/proxy-media", async (req, res) => {
    const url = req.query.url as string;
    if (!url || !url.startsWith("http")) return res.status(400).json({ error: "Invalid url" });
    try {
      const apiKey = process.env.GEMINIGEN_API_KEY;
      const headers: Record<string, string> = {
        Accept: "image/*,video/*,audio/*,*/*",
        "User-Agent": "LyvrixMediaProxy/1.0",
      };
      if (apiKey && url.includes("geminigen")) headers["x-api-key"] = apiKey;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return res.status(response.status).send(response.statusText);
      }
      const ct = response.headers.get("content-type") || "application/octet-stream";
      res.setHeader("Content-Type", ct);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (e: any) {
      console.error("[Proxy media]", e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- Cloudflare R2 upload endpoints (replaces Convex file storage for media) ---
  app.post("/api/upload-r2", express.raw({ type: "*/*", limit: "100mb" }), async (req, res) => {
    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
    }
    try {
      const body = req.body as Buffer;
      if (!body || body.length === 0) {
        return res.status(400).json({ error: "No file body" });
      }
      const contentType = (req.headers["content-type"] as string) || "application/octet-stream";
      const ext = contentType.split("/")[1]?.split(";")[0] || "bin";
      const prefix = ext === "json" ? "data" : "media";
      const { url } = await uploadToR2(body, { contentType, keyPrefix: prefix, extension: ext });
      return res.json({ url });
    } catch (e: any) {
      console.error("[R2 upload]", e);
      return res.status(500).json({ error: e.message || "Upload failed" });
    }
  });

  // Multipart variant for form uploads (e.g. <input type="file">)
  app.post("/api/upload-r2/multipart", upload.single("file"), async (req, res) => {
    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
    }
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file?.buffer) {
        return res.status(400).json({ error: "No file in request (use field name 'file')" });
      }
      const ext = file.mimetype?.split("/")[1] || file.originalname?.split(".").pop() || "bin";
      const { url } = await uploadToR2(file.buffer, {
        contentType: file.mimetype || "application/octet-stream",
        keyPrefix: "media",
        extension: ext,
      });
      return res.json({ url });
    } catch (e: any) {
      console.error("[R2 upload multipart]", e);
      return res.status(500).json({ error: e.message || "Upload failed" });
    }
  });

  app.post("/api/ingest-url", express.json(), async (req, res) => {
    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
    }
    try {
      const { url, downloadUrl } = req.body || {};
      const urlToFetch = downloadUrl || url;
      if (!urlToFetch || typeof urlToFetch !== "string" || !urlToFetch.startsWith("http")) {
        return res.status(400).json({ error: "Missing or invalid url (or downloadUrl)" });
      }
      const apiKey = process.env.GEMINIGEN_API_KEY;
      const headers: Record<string, string> = {
        Accept: "image/*,video/*,audio/*,*/*",
        "User-Agent": "LyvrixMediaProxy/1.0",
      };
      if (apiKey && urlToFetch.includes("geminigen")) headers["x-api-key"] = apiKey;
      const response = await fetch(urlToFetch, { headers });
      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch: ${response.statusText} (${response.status})`,
        });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const ext = contentType.split("/")[1]?.split(";")[0] || "bin";
      const { url: r2Url } = await uploadToR2(buffer, {
        contentType,
        keyPrefix: "media",
        extension: ext,
      });
      return res.json({ url: r2Url });
    } catch (e: any) {
      console.error("[R2 ingest-url]", e);
      return res.status(500).json({ error: e.message || "Ingest failed" });
    }
  });

  app.post("/api/ingest-text", express.json(), async (req, res) => {
    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
    }
    try {
      const { text } = req.body || {};
      if (typeof text !== "string") {
        return res.status(400).json({ error: "Missing or invalid text" });
      }
      const buffer = Buffer.from(text, "utf-8");
      const { url } = await uploadToR2(buffer, {
        contentType: "text/plain",
        keyPrefix: "text",
        extension: "txt",
      });
      return res.json({ url });
    } catch (e: any) {
      console.error("[R2 ingest-text]", e);
      return res.status(500).json({ error: e.message || "Ingest failed" });
    }
  });

  // Workflow/nodes JSON: store in R2 with fixed key per project (overwrites = no duplicate entries)
  app.post("/api/workflow-save", express.json({ limit: "10mb" }), async (req, res) => {
    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
    }
    try {
      const { projectId, nodes, edges } = req.body || {};
      if (!projectId || typeof projectId !== "string" || projectId.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid projectId" });
      }
      const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_") || "project";
      const nodesKey = `workflows/${safeId}/nodes.json`;
      const edgesKey = `workflows/${safeId}/edges.json`;

      let nodesUrl: string | null = null;
      let edgesUrl: string | null = null;

      if (nodes !== undefined && nodes !== null) {
        const buf =
          typeof nodes === "string" ? Buffer.from(nodes, "utf-8") : Buffer.from(JSON.stringify(nodes), "utf-8");
        const { url } = await uploadToR2(buf, {
          key: nodesKey,
          contentType: "application/json",
        });
        nodesUrl = url;
      }
      if (edges !== undefined && edges !== null) {
        const buf =
          typeof edges === "string" ? Buffer.from(edges, "utf-8") : Buffer.from(JSON.stringify(edges), "utf-8");
        const { url } = await uploadToR2(buf, {
          key: edgesKey,
          contentType: "application/json",
        });
        edgesUrl = url;
      }

      if (!nodesUrl || !edgesUrl || !nodesUrl.includes("/") || !edgesUrl.includes("/")) {
        return res.status(500).json({ error: "Workflow save failed: invalid URL from R2" });
      }
      return res.json({ nodesUrl, edgesUrl });
    } catch (e: any) {
      console.error("[R2 workflow-save]", e);
      return res.status(500).json({ error: e.message || "Workflow save failed" });
    }
  });

  // Preview image: fixed key per project (overwrites old preview = no duplicate storage)
  app.post("/api/workflow-preview", express.raw({ type: "image/*", limit: "5mb" }), async (req, res) => {
    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured." });
    }
    try {
      const projectId = (req.headers["x-project-id"] as string)?.trim();
      if (!projectId) return res.status(400).json({ error: "Missing x-project-id header" });
      const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_") || "project";
      const key = `workflows/${safeId}/preview.jpg`;
      const body = req.body as Buffer;
      if (!body || body.length === 0) return res.status(400).json({ error: "No image body" });
      const { url } = await uploadToR2(body, { key, contentType: "image/jpeg" });
      if (!url || !url.includes("/")) return res.status(500).json({ error: "Invalid preview URL" });
      return res.json({ previewUrl: url });
    } catch (e: any) {
      console.error("[R2 workflow-preview]", e);
      return res.status(500).json({ error: e.message || "Preview upload failed" });
    }
  });

  // Groq chat proxy (keeps API key server-side)
  app.post("/api/groq/chat", express.json(), async (req, res) => {
    try {
      const { messages, systemPrompt, model, maxTokens } = req.body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages array required" });
      }
      const fullMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
      if (systemPrompt && typeof systemPrompt === "string") {
        fullMessages.push({ role: "system", content: systemPrompt });
      }
      for (const m of messages) {
        if (m?.role && m?.content) {
          fullMessages.push({
            role: m.role as "system" | "user" | "assistant",
            content: String(m.content),
          });
        }
      }
      const content = await groqChat(fullMessages, { model, maxTokens });
      return res.json({ content });
    } catch (e: any) {
      console.error("[Groq chat]", e);
      return res.status(500).json({ error: e.message || "Groq chat failed" });
    }
  });

  app.get("/api/geminigen/status/:uuid", async (req, res) => {
    try {
      const apiKey = process.env.GEMINIGEN_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINIGEN_API_KEY not configured" });

      const response = await fetch(`${GEMINIGEN_BASE_URL}/history/${req.params.uuid}`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
