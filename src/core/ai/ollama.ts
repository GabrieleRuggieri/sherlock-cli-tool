/**
 * Ollama provider — free, local, no API key.
 * Requires Ollama running: https://ollama.com
 */

const OLLAMA_BASE = "http://localhost:11434";

export async function ollamaGenerate(prompt: string, model: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "llama3.2",
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Ollama request failed (${res.status}). Is Ollama running? Run \`ollama serve\` and \`ollama pull ${model || "llama3.2"}\`. ${err}`
    );
  }

  const data = (await res.json()) as { response?: string };
  return data.response?.trim() ?? "";
}

export async function* ollamaGenerateStream(
  prompt: string,
  model: string
): AsyncGenerator<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "llama3.2",
      prompt,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Ollama request failed (${res.status}). Is Ollama running? Run \`ollama serve\` and \`ollama pull ${model || "llama3.2"}\`. ${err}`
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Ollama: no response body");

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
        if (line.trim()) {
          try {
            const data = JSON.parse(line) as { response?: string };
            if (data.response) yield data.response;
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
