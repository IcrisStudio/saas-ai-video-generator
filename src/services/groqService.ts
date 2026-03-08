/**
 * Groq chat service – calls backend /api/groq/chat so API key stays server-side.
 * Used for workspace AI: suggestions, prompt enhancement, node help, approve-to-add-node.
 */

const API_BASE = "";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export interface GroqChatOptions {
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Send messages to Groq and return the assistant reply.
 */
export async function chat(
  messages: ChatMessage[],
  options: GroqChatOptions = {}
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/groq/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      systemPrompt: options.systemPrompt,
      model: options.model,
      maxTokens: options.maxTokens,
    }),
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Groq chat failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.content ?? "";
}

const VALID_NODE_TYPES = ["upload", "imagination", "text", "video", "enhancer", "geminigenText", "geminigenTTS", "aiModel", "extractFrame", "faceSwap"];

function normalizeNodeType(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (VALID_NODE_TYPES.includes(s)) return s;
  if (s.includes("upload")) return "upload";
  if (s.includes("imagination") || s.includes("imagine")) return "imagination";
  if (s.includes("text")) return "text";
  if (s.includes("video")) return "video";
  if (s.includes("enhanc")) return "enhancer";
  return undefined;
}

/**
 * Parse a suggested action from the AI reply. Tolerates malformed JSON (e.g. prompt in nodeType).
 */
export function parseSuggestedAction(content: string): {
  suggestedAction: string;
  nodeType?: string;
  prompt?: string;
  connectToNodeId?: string;
} | null {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.startsWith("{")) continue;
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      if (obj.suggestedAction !== "add_node") continue;
      const nodeType = normalizeNodeType(obj.nodeType as string);
      if (!nodeType) continue;
      const prompt = typeof obj.prompt === "string" ? obj.prompt.trim() : "";
      const connectToNodeId = typeof obj.connectToNodeId === "string" && obj.connectToNodeId.trim() ? obj.connectToNodeId.trim() : undefined;
      return {
        suggestedAction: "add_node",
        nodeType,
        prompt: prompt || undefined,
        connectToNodeId,
      };
    } catch (_) {}
  }
  const fallback = content.match(/\{[\s\S]*?"suggestedAction"[\s\S]*?\}/);
  if (fallback) {
    try {
      const obj = JSON.parse(fallback[0]) as Record<string, unknown>;
      const nodeType = normalizeNodeType(obj.nodeType as string);
      if (obj.suggestedAction && nodeType)
        return {
          suggestedAction: String(obj.suggestedAction),
          nodeType,
          prompt: typeof obj.prompt === "string" ? obj.prompt.trim() || undefined : undefined,
          connectToNodeId: typeof obj.connectToNodeId === "string" ? obj.connectToNodeId || undefined : undefined,
        };
    } catch (_) {}
  }
  return null;
}
