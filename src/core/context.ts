import type { IndexResult, IndexedFile } from "./indexer.js";

export type TaskMode = "docs" | "bugs" | "map" | "ask";

// Groq free tier: 6000 TPM limit. Keep context small (~3k chars ≈ 800 tokens) to stay under limit.
const MAX_CONTEXT_FILES = 6;
const MAX_FILE_CHARS = 350;

/**
 * Truncate file content to stay within token budget.
 */
function truncate(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "\n\n... (truncated)";
}

/**
 * Build a minimal context string from selected files for the AI.
 */
function buildContextString(files: IndexedFile[]): string {
  const parts: string[] = [];
  let total = 0;
  const perFile = Math.floor(MAX_FILE_CHARS * MAX_CONTEXT_FILES / files.length);
  for (const f of files) {
    const chunk = `## ${f.relativePath}\n\`\`\`\n${truncate(f.content, perFile)}\n\`\`\`\n`;
    parts.push(chunk);
    total += chunk.length;
  }
  return parts.join("\n");
}

function priorityDocs(f: IndexedFile): number {
  const p = f.relativePath.toLowerCase();
  if (p === "readme.md" || p === "package.json") return 0;
  if (p.endsWith(".json") || p.endsWith(".yaml") || p.endsWith(".yml")) return 1;
  if (p.includes("src") || p.includes("lib") || p.includes("app")) return 2;
  return 3;
}

function priorityBugs(f: IndexedFile): number {
  const p = f.relativePath.toLowerCase();
  if (p.includes("src") || p.includes("lib") || p.includes("app")) return 0;
  if (/\.(ts|tsx|js|jsx)$/.test(p)) return 1;
  return 2;
}

function priorityAsk(f: IndexedFile, query: string): number {
  const p = f.relativePath.toLowerCase();
  const q = query.toLowerCase();
  if (q.includes("auth") && (p.includes("auth") || p.includes("login"))) return 0;
  if (q.includes("payment") && p.includes("payment")) return 0;
  if (p === "readme.md" || p === "package.json") return 1;
  if (p.includes("src") || p.includes("lib")) return 2;
  return 3;
}

/**
 * Select which files to include based on the task.
 */
export function buildContext(index: IndexResult, mode: TaskMode, query?: string): string {
  const { files } = index;
  if (files.length === 0) return "(No files indexed)";

  const priority =
    mode === "docs"
      ? priorityDocs
      : mode === "bugs"
        ? priorityBugs
        : (f: IndexedFile) => priorityAsk(f, query ?? "");

  const sorted = [...files].sort((a, b) => priority(a) - priority(b));
  const selected = sorted.slice(0, MAX_CONTEXT_FILES);
  return buildContextString(selected);
}
