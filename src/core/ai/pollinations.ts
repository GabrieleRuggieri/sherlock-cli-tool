/**
 * Pollinations provider — free cloud API, no API key required (2025–2026).
 * POST https://text.pollinations.ai/openai — OpenAI-compatible chat completions.
 * Rate limits apply for anonymous tier; optional token for higher limits.
 */

const POLLINATIONS_OPENAI_URL = "https://text.pollinations.ai/openai";

export async function pollinationsGenerate(prompt: string, model: string): Promise<string> {
  const res = await fetch(POLLINATIONS_OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "openai",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pollinations API failed (${res.status}). ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };
  // Use content only — reasoning_content is the model's chain-of-thought, not the answer
  const content = data.choices?.[0]?.message?.content;
  return content?.trim() ?? "";
}

export async function* pollinationsGenerateStream(
  prompt: string,
  model: string
): AsyncGenerator<string> {
  const res = await fetch(POLLINATIONS_OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "openai",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pollinations API failed (${res.status}). ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Pollinations: no response body");

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
