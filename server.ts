import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fetch from "node-fetch";
import multer from "multer";
import FormData from "form-data";

// Load .env first, then .env.local so local overrides take effect
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

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
