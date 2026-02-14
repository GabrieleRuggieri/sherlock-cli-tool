import { readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { homedir, platform } from "os";

/**
 * Get the user's home directory (cross-platform).
 */
export function getHomeDir(): string {
  return homedir();
}

/**
 * Check if we're at filesystem root (can't go up).
 */
function isAtRoot(p: string): boolean {
  const normalized = resolve(p);
  if (platform() === "win32") {
    return normalized.length <= 3 && /^[A-Za-z]:[\\/]?$/.test(normalized);
  }
  return normalized === "/";
}

/**
 * List directories in a path. Returns { name, path } for each subdirectory.
 * Includes ".." (parent) as first entry when not at root.
 */
export function listDirectories(currentPath: string): Array<{ name: string; path: string }> {
  const entries: Array<{ name: string; path: string }> = [];

  if (!isAtRoot(currentPath)) {
    entries.push({ name: "..", path: resolve(currentPath, "..") });
  }

  try {
    const items = readdirSync(currentPath, { withFileTypes: true });
    const dirs = items
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    for (const d of dirs) {
      entries.push({ name: d.name, path: join(currentPath, d.name) });
    }
  } catch {
    // Permission denied or invalid path
  }

  return entries;
}

/**
 * Check if a path exists and is a directory.
 */
export function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
