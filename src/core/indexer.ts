import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { loadIgnorePatterns, isIgnored } from "../utils/paths.js";

export interface IndexedFile {
  path: string;
  relativePath: string;
  content: string;
  language?: string;
}

export interface IndexResult {
  rootDir: string;
  files: IndexedFile[];
  totalFiles: number;
}

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".go", ".rs", ".java", ".kt",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".php",
  ".md", ".json", ".yaml", ".yml", ".html", ".css", ".scss",
]);

/**
 * Recursively scan a directory and return file paths that are not ignored.
 */
function collectFiles(
  dir: string,
  rootDir: string,
  patterns: string[],
  acc: string[] = []
): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(rootDir, fullPath);
    if (isIgnored(relPath, patterns)) continue;
    if (entry.isDirectory()) {
      collectFiles(fullPath, rootDir, patterns, acc);
    } else if (entry.isFile()) {
      const ext = entry.name.includes(".") ? "." + entry.name.split(".").pop()!.toLowerCase() : "";
      if (TEXT_EXTENSIONS.has(ext) || !ext) acc.push(fullPath);
    }
  }
  return acc;
}

/**
 * Index a repository: scan files, apply .gitignore, read contents.
 * Phase 1: no tree-sitter; we just read file contents for context.
 */
export function indexRepo(rootDir: string, extraExclude: string[] = []): IndexResult {
  const patterns = loadIgnorePatterns(rootDir).concat(extraExclude);
  const filePaths = collectFiles(rootDir, rootDir, patterns);
  const files: IndexedFile[] = [];

  for (const filePath of filePaths) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const relativePath = relative(rootDir, filePath);
      const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
      files.push({
        path: filePath,
        relativePath,
        content,
        language: ext || undefined,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return {
    rootDir,
    files,
    totalFiles: files.length,
  };
}
