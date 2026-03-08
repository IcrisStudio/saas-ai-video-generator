import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not set. Add it to your environment." });
    }

    const { messages, systemPrompt, model, maxTokens } = (req.body || {}) as {
      messages?: Array<{ role?: string; content?: string }>;
      systemPrompt?: string;
      model?: string;
      maxTokens?: number;
    };

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

    const body = {
      model: model ?? DEFAULT_MODEL,
      messages: fullMessages,
      max_tokens: maxTokens ?? 2048,
      temperature: 0.6,
    };

    const groqRes = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      let errMsg = `Groq API error: ${groqRes.status}`;
      try {
        const j = JSON.parse(text);
        if (j.error?.message) errMsg = j.error.message;
      } catch (_) {
        if (text) errMsg = text.slice(0, 200);
      }
      return res.status(groqRes.status).json({ error: errMsg });
    }

    const data = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = (data.choices?.[0]?.message?.content ?? "").trim();
    return res.status(200).json({ content });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Groq chat failed";
    console.error("[Groq chat]", e);
    return res.status(500).json({ error: message });
  }
}
