import { readFileSync, existsSync } from "fs";
import { join, relative, resolve } from "path";
import { minimatch } from "minimatch";

const DEFAULT_IGNORE = [
  "node_modules",
  "dist",
  "build",
  ".git",
  "*.log",
  ".env",
  ".env.*",
];

/**
 * Parse .gitignore-style patterns from a file or use defaults.
 * Returns an array of minimatch-compatible patterns.
 */
export function loadIgnorePatterns(rootDir: string): string[] {
  const gitignorePath = join(rootDir, ".gitignore");
  if (!existsSync(gitignorePath)) {
    return DEFAULT_IGNORE;
  }
  try {
    const content = readFileSync(gitignorePath, "utf-8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    return [...DEFAULT_IGNORE, ...lines];
  } catch {
    return DEFAULT_IGNORE;
  }
}

/**
 * Check if a path (relative to rootDir) should be ignored.
 */
export function isIgnored(relativePath: string, patterns: string[]): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return patterns.some((pattern) => minimatch(normalized, pattern, { matchBase: true }));
}

/**
 * Resolve the target directory (defaults to cwd).
 */
export function resolveTargetDir(pathArg?: string): string {
  return pathArg ? resolve(process.cwd(), pathArg) : process.cwd();
}
