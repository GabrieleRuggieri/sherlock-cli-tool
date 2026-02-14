/**
 * Groq provider — free cloud API (2025–2026), free tier, no credit card.
 * Requires API key from https://console.groq.com
 * OpenAI-compatible: POST https://api.groq.com/openai/v1/chat/completions
 */

const GROQ_BASE = "https://api.groq.com/openai/v1";

export async function groqGenerate(
  prompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Groq API failed (${res.status}). Get a free key at https://console.groq.com — ${err}`
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  return content?.trim() ?? "";
}

export async function* groqGenerateStream(
  prompt: string,
  model: string,
  apiKey: string
): AsyncGenerator<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Groq API failed (${res.status}). Get a free key at https://console.groq.com — ${err}`
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Groq: no response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const json = JSON.parse(line.slice(6)) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = json.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
