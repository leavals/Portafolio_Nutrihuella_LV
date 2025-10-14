// src/services/ollama.ts
const BASE = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

/**
 * Llama al endpoint /api/chat de Ollama y pide respuesta JSON (format: "json")
 */
export async function chatJSON(system: string, user: string): Promise<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      stream: false,
      format: "json",
      options: { temperature: 0.2 }
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OLLAMA ${res.status} - ${text}`);
  }

  const data = await res.json().catch(() => ({} as any));
  const content = data?.message?.content ?? "";
  if (!content) throw new Error("OLLAMA respuesta vacía.");
  return content as string;
}
