/**
 * Anthropic provider — cloud API, requires ANTHROPIC_API_KEY.
 */

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(apiKey: string): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function anthropicGenerate(
  prompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const client = getClient(apiKey);
  const response = await client.messages.create({
    model: model || "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find(
    (b): b is { type: "text"; text: string } => b.type === "text"
  );
  return block?.text ?? "";
}

export async function* anthropicGenerateStream(
  prompt: string,
  model: string,
  apiKey: string
): AsyncGenerator<string> {
  const client = getClient(apiKey);
  const stream = await client.messages.create({
    model: model || "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta?.type === "text_delta" &&
      event.delta.text
    ) {
      yield event.delta.text;
    }
  }
}
