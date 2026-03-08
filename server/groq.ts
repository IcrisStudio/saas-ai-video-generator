/**
 * Groq API proxy – chat completions using best model for workspace AI.
 * Uses llama-3.3-70b-versatile for quality (suggestions, prompt enhancement, node help).
 * API key must be set in env (GROQ_API_KEY); calls go through server to avoid exposing key.
 */

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

// Best model for assistant: strong reasoning, 131K context (for workspace summary)
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export async function groqChat(
  messages: GroqMessage[],
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your .env or .env.local.");
  }

  const model = options.model ?? DEFAULT_MODEL;
  const body = {
    model,
    messages,
    max_tokens: options.maxTokens ?? 2048,
    temperature: 0.6,
  };

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = `Groq API error: ${res.status}`;
    try {
      const j = JSON.parse(text);
      if (j.error?.message) errMsg = j.error.message;
    } catch (_) {
      if (text) errMsg = text.slice(0, 200);
    }
    throw new Error(errMsg);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}
