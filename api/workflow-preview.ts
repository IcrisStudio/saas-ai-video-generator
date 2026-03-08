import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = {
  api: { bodyParser: false },
};

function getR2Env() {
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrlBase: process.env.R2_PUBLIC_URL,
  };
}

function getR2Client(): S3Client | null {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = getR2Env();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getPublicUrl(key: string): string {
  const { publicUrlBase } = getR2Env();
  if (!publicUrlBase) throw new Error("R2_PUBLIC_URL is not set.");
  const base = publicUrlBase.replace(/\/$/, "");
  return `${base}/${key}`;
}

function isR2Configured(): boolean {
  const e = getR2Env();
  return !!(e.accountId && e.accessKeyId && e.secretAccessKey && e.bucketName && e.publicUrlBase);
}

async function uploadToR2(
  buffer: Buffer,
  options: { contentType?: string; key: string }
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const { bucketName } = getR2Env();
  if (!client || !bucketName) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL."
    );
  }
  const key = options.key;
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: options.contentType ?? "application/octet-stream",
    })
  );
  return { url: getPublicUrl(key), key };
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured." });
    }

    const projectId = (req.headers["x-project-id"] as string)?.trim();
    if (!projectId) {
      return res.status(400).json({ error: "Missing x-project-id header" });
    }

    let body: Buffer;
    try {
      body = await getRawBody(req);
    } catch (streamErr) {
      return res
        .status(400)
        .json({ error: "Could not read request body. Request stream not available." });
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
