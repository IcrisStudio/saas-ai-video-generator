/**
 * R2 upload helper for Vercel serverless (self-contained so api/ bundles correctly).
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

export function isR2Configured(): boolean {
  const e = getR2Env();
  return !!(e.accountId && e.accessKeyId && e.secretAccessKey && e.bucketName && e.publicUrlBase);
}

export async function uploadToR2(
  buffer: Buffer,
  options: { contentType?: string; key: string }
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const { bucketName } = getR2Env();
  if (!client || !bucketName) {
    throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL.");
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
