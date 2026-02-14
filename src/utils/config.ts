import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface CodeOpsConfig {
  provider: string;
  model: string;
  exclude: string[];
  output: {
    save_reports: boolean;
  };
}

const VALID_PROVIDERS = ["groq", "anthropic", "ollama", "pollinations"] as const;
export type Provider = (typeof VALID_PROVIDERS)[number];

const DEFAULT_CONFIG: CodeOpsConfig = {
  provider: "groq",
  model: "llama-3.1-8b-instant",
  exclude: ["node_modules", "dist", ".git"],
  output: {
    save_reports: false,
  },
};

function normalizeProvider(value: string): Provider {
  const p = value?.toLowerCase().trim();
  return VALID_PROVIDERS.includes(p as Provider) ? (p as Provider) : DEFAULT_CONFIG.provider;
}

/**
 * Load and validate .codeopsrc from the target repo root.
 * Falls back to defaults if file is missing or invalid.
 */
export function loadConfig(rootDir: string): CodeOpsConfig {
  const configPath = join(rootDir, ".codeopsrc");
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content) as Partial<CodeOpsConfig>;
    return {
      provider: normalizeProvider(parsed.provider ?? DEFAULT_CONFIG.provider),
      model: (parsed.model ?? DEFAULT_CONFIG.model).trim() || DEFAULT_CONFIG.model,
      exclude: Array.isArray(parsed.exclude) ? parsed.exclude : DEFAULT_CONFIG.exclude,
      output: {
        save_reports: parsed.output?.save_reports ?? DEFAULT_CONFIG.output.save_reports,
      },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Get API key from environment (Bun/Node load .env automatically when present).
 */
export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

/** Groq free-tier API key (optional for provider "groq"). */
export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}
