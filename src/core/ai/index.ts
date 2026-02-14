import { ollamaGenerate, ollamaGenerateStream } from "./ollama.js";
import { anthropicGenerate, anthropicGenerateStream } from "./anthropic.js";
import { pollinationsGenerate, pollinationsGenerateStream } from "./pollinations.js";
import { groqGenerate, groqGenerateStream } from "./groq.js";
import { getApiKey, getGroqApiKey } from "../../utils/config.js";

const DOCS_SYSTEM = `You are a technical writer. Based on the following codebase context, generate a comprehensive DOCS.md in Markdown with exactly these three sections:

## 1. Project Overview
- Project name, purpose, and high-level description
- Tech stack (infer from package.json, imports, file extensions)
- Setup/installation and usage instructions
- Do not invent features not suggested by the code

## 2. Function & Class Documentation
- For each exported function and class found in the code: name, brief description, parameters (with types if visible), return value, and notable behavior
- Group by file or module
- Be concise; skip trivial getters/setters unless important

## 3. Architecture Overview
- High-level description of how modules relate to each other
- Entry points and main flows
- Key dependencies between components
- Describe the structure inferred from imports and file organization

Output only the Markdown document, no preamble or meta-commentary.`;

const BUGS_SYSTEM = `You are a static analysis assistant. Analyze the following codebase context and report potential issues in this exact Markdown format:

## filename.ts
### Line N — [error|warning|info] Short issue title
Brief explanation.

Repeat for each issue. Look for: missing error handling (async/await, promises), unused imports/variables, suspicious logic (always true/false conditions), unreachable code, security red flags (hardcoded secrets, unsanitized inputs), and common bugs. Be concise. Output only the report, no preamble.`;

const ASK_SYSTEM =
  "You are a codebase expert. Answer the user's question based ONLY on the provided code context. Be concise and cite specific files/functions when relevant. Do not invent features not present in the code. If the answer cannot be found in the context, say so.";

/**
 * Generate README/documentation from codebase context.
 * Providers: "ollama" (free, local) | "pollinations" (free, cloud, no key) | "groq" (free, cloud, key) | "anthropic" (cloud, key).
 */
export async function generateDocs(
  context: string,
  provider: string,
  model: string
): Promise<string> {
  const prompt = `${DOCS_SYSTEM}\n\n${context}`;
  const p = (provider || "ollama").toLowerCase();

  if (p === "anthropic") {
    const key = getApiKey();
    if (!key)
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Use a free provider (ollama, pollinations, groq) or add your key to .env"
      );
    return anthropicGenerate(prompt, model, key);
  }

  if (p === "groq") {
    const key = getGroqApiKey();
    if (!key)
      throw new Error(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env"
      );
    return groqGenerate(prompt, model, key);
  }

  if (p === "pollinations") {
    return pollinationsGenerate(prompt, model || "openai");
  }

  // Default: ollama (free, local)
  return ollamaGenerate(prompt, model || "llama3.2");
}

/**
 * Generate bug report from codebase context.
 */
export async function generateBugs(
  context: string,
  provider: string,
  model: string
): Promise<string> {
  const prompt = `${BUGS_SYSTEM}\n\n${context}`;
  const p = (provider || "ollama").toLowerCase();

  if (p === "anthropic") {
    const key = getApiKey();
    if (!key)
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Use a free provider (ollama, pollinations, groq) or add your key to .env"
      );
    return anthropicGenerate(prompt, model, key);
  }

  if (p === "groq") {
    const key = getGroqApiKey();
    if (!key)
      throw new Error(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env"
      );
    return groqGenerate(prompt, model, key);
  }

  if (p === "pollinations") {
    return pollinationsGenerate(prompt, model || "openai");
  }

  return ollamaGenerate(prompt, model || "llama3.2");
}

/**
 * Answer a question about the codebase. Returns full response (non-streaming).
 */
export async function generateAsk(
  context: string,
  question: string,
  provider: string,
  model: string
): Promise<string> {
  const prompt = `${ASK_SYSTEM}\n\n---\nContext:\n${context}\n\n---\nQuestion: ${question}\n\nAnswer:`;
  const p = (provider || "ollama").toLowerCase();

  if (p === "anthropic") {
    const key = getApiKey();
    if (!key)
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Use a free provider (ollama, pollinations, groq) or add your key to .env"
      );
    return anthropicGenerate(prompt, model, key);
  }

  if (p === "groq") {
    const key = getGroqApiKey();
    if (!key)
      throw new Error(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env"
      );
    return groqGenerate(prompt, model, key);
  }

  if (p === "pollinations") {
    return pollinationsGenerate(prompt, model || "openai");
  }

  return ollamaGenerate(prompt, model || "llama3.2");
}

/**
 * Answer a question about the codebase with streaming. Yields chunks as they arrive.
 */
export async function* generateAskStream(
  context: string,
  question: string,
  provider: string,
  model: string
): AsyncGenerator<string> {
  const prompt = `${ASK_SYSTEM}\n\n---\nContext:\n${context}\n\n---\nQuestion: ${question}\n\nAnswer:`;
  const p = (provider || "ollama").toLowerCase();

  if (p === "anthropic") {
    const key = getApiKey();
    if (!key)
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Use a free provider (ollama, pollinations, groq) or add your key to .env"
      );
    yield* anthropicGenerateStream(prompt, model, key);
    return;
  }

  if (p === "groq") {
    const key = getGroqApiKey();
    if (!key)
      throw new Error(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env"
      );
    yield* groqGenerateStream(prompt, model, key);
    return;
  }

  if (p === "pollinations") {
    yield* pollinationsGenerateStream(prompt, model || "openai");
    return;
  }

  yield* ollamaGenerateStream(prompt, model || "llama3.2");
}
