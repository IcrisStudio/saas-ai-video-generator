import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!isR2Configured()) {
      return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
    }

    const { projectId, nodes, edges } = (req.body || {}) as {
      projectId?: string;
      nodes?: string | unknown[];
      edges?: string | unknown[];
    };

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
        typeof nodes === "string"
          ? Buffer.from(nodes, "utf-8")
          : Buffer.from(JSON.stringify(nodes), "utf-8");
      const { url } = await uploadToR2(buf, { key: nodesKey, contentType: "application/json" });
      nodesUrl = url;
    }
    if (edges !== undefined && edges !== null) {
      const buf =
        typeof edges === "string"
          ? Buffer.from(edges, "utf-8")
          : Buffer.from(JSON.stringify(edges), "utf-8");
      const { url } = await uploadToR2(buf, { key: edgesKey, contentType: "application/json" });
      edgesUrl = url;
    }

    if (!nodesUrl || !edgesUrl || !nodesUrl.includes("/") || !edgesUrl.includes("/")) {
      return res.status(500).json({ error: "Workflow save failed: invalid URL from R2" });
    }

    return res.status(200).json({ nodesUrl, edgesUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Workflow save failed";
    console.error("[R2 workflow-save]", e);
    return res.status(500).json({ error: message });
  }
}
