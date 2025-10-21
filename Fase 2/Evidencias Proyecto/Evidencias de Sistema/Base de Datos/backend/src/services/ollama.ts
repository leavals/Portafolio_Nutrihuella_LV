// src/services/ollama.ts
import { env } from "../env.ts";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatJSON(system: string, user: string): Promise<string> {
  const url = `${env.OLLAMA_BASE_URL.replace(/\/+$/, "")}/api/chat`;

  const body = {
    model: env.OLLAMA_MODEL,
    stream: false,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ] as ChatMessage[],
    options: {
      temperature: 0.4,
      top_p: 0.9,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${t || res.statusText}`);
  }

  const data: any = await res.json();
  // /api/chat → data.message.content; /api/generate → data.response
  return String(data?.message?.content ?? data?.response ?? "");
}
