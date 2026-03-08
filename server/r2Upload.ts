/**
 * Cloudflare R2 upload helper using S3-compatible API.
 * Uploads files to R2 and returns the public URL.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generate a unique object key for storage.
 */
function makeObjectKey(prefix: string, extension: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = extension ? (extension.startsWith(".") ? extension : `.${extension}`) : "";
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

/**
 * Get the public URL for an object key.
 */
export function getPublicUrl(key: string): string {
  const { publicUrlBase } = getR2Env();
  if (!publicUrlBase) {
    throw new Error("R2_PUBLIC_URL is not set. Configure public access for your R2 bucket.");
  }
  const base = publicUrlBase.replace(/\/$/, "");
  return `${base}/${key}`;
}

/**
 * Upload a buffer to R2 and return the public URL.
 * If options.key is provided, that key is used (overwrites existing); otherwise a unique key is generated.
 */
export async function uploadToR2(
  buffer: Buffer,
  options: {
    contentType?: string;
    keyPrefix?: string;
    extension?: string;
    key?: string;
  } = {}
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const { bucketName } = getR2Env();
  if (!client || !bucketName) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
    );
  }

  const key =
    options.key ??
    makeObjectKey(options.keyPrefix ?? "media", options.extension ?? "bin");

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: options.contentType ?? "application/octet-stream",
    })
  );

  const url = getPublicUrl(key);
  return { url, key };
}

/**
 * Delete an object from R2 by key (e.g. to remove old workflow file after uploading new one elsewhere).
 */
export async function deleteFromR2ByKey(key: string): Promise<void> {
  const client = getR2Client();
  const { bucketName } = getR2Env();
  if (!client || !bucketName) return;
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: key })
    );
  } catch (e) {
    console.warn("[R2] delete failed for key:", key, e);
  }
}

export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlBase } = getR2Env();
  return !!(accountId && accessKeyId && secretAccessKey && bucketName && publicUrlBase);
}
