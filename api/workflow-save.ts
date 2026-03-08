import type { VercelRequest, VercelResponse } from "@vercel/node";
import { uploadToR2, isR2Configured } from "./lib/r2";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!isR2Configured()) {
    return res.status(503).json({ error: "R2 storage is not configured. Set R2_* env vars." });
  }

  try {
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
      const { url } = await uploadToR2(buf, {
        key: nodesKey,
        contentType: "application/json",
      });
      nodesUrl = url;
    }
    if (edges !== undefined && edges !== null) {
      const buf =
        typeof edges === "string"
          ? Buffer.from(edges, "utf-8")
          : Buffer.from(JSON.stringify(edges), "utf-8");
      const { url } = await uploadToR2(buf, {
        key: edgesKey,
        contentType: "application/json",
      });
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
