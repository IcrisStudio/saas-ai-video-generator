/**
 * Storage service: uploads media to Cloudflare R2 via the backend API.
 * Returns the public R2 URL; Convex stores that URL in the database.
 */

const API_BASE = ""; // same origin (dev/prod server)

/**
 * Upload a blob (file) to R2. Returns the public URL.
 */
export async function uploadBlobToR2(
  blob: Blob,
  _fileName?: string
): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/upload-r2`, {
    method: "POST",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Upload failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("No URL returned from R2 upload");
  return { url: data.url };
}

/**
 * Have the server fetch a file from a URL and upload it to R2. Returns the public R2 URL.
 * Use this for generated media URLs (avoids CORS and keeps upload server-side).
 */
export async function ingestUrlToR2(
  url: string,
  downloadUrl?: string
): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/ingest-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, downloadUrl }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Ingest failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("No URL returned from R2 ingest");
  return { url: data.url };
}

/**
 * Upload raw text to R2 and return the public URL.
 */
export async function ingestTextToR2(text: string): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/ingest-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Ingest text failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("No URL returned from R2 ingest-text");
  return { url: data.url };
}

/**
 * Fetch media from a URL and store it in R2 (replacing Convex file storage).
 * Uses server-side ingest to avoid CORS. Returns the R2 URL; use that as both url and storageId when saving to Convex.
 */
export async function clientFetchAndUploadToR2(
  mediaUrl: string,
  downloadUrl?: string
): Promise<{ url: string; storageId: string }> {
  const { url } = await ingestUrlToR2(mediaUrl, downloadUrl);
  return { url, storageId: url };
}

/**
 * Save workflow (nodes + edges) to R2 with a fixed key per project.
 * Overwrites any existing workflow for that project so there are no duplicate entries.
 * Returns URLs to store in Convex (nodesStorageId, edgesStorageId).
 */
export async function uploadWorkflowToR2(
  projectId: string,
  nodesJson: string,
  edgesJson: string
): Promise<{ nodesUrl: string; edgesUrl: string }> {
  const res = await fetch(`${API_BASE}/api/workflow-save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, nodes: nodesJson, edges: edgesJson }),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Workflow save failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.nodesUrl || !data.edgesUrl || !data.nodesUrl.includes("/") || !data.edgesUrl.includes("/")) {
    throw new Error("Invalid nodesUrl or edgesUrl from workflow save");
  }
  return { nodesUrl: data.nodesUrl, edgesUrl: data.edgesUrl };
}

/**
 * Upload project preview to R2 with fixed key (overwrites old preview).
 * Returns the public URL to store as previewStorageId.
 */
export async function uploadWorkflowPreviewToR2(projectId: string, imageBlob: Blob): Promise<string> {
  const res = await fetch(`${API_BASE}/api/workflow-preview`, {
    method: "POST",
    headers: { "X-Project-Id": projectId, "Content-Type": "image/jpeg" },
    body: imageBlob,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Preview upload failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.previewUrl || !data.previewUrl.includes("/")) throw new Error("Invalid previewUrl");
  return data.previewUrl;
}
