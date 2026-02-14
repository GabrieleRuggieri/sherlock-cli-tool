import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Get file change frequency (how many commits touched each file) for the repo.
 * Returns a Map of relative path -> commit count.
 */
export function getFileChangeStats(rootDir: string): Map<string, number> {
  const gitDir = join(rootDir, ".git");
  if (!existsSync(gitDir)) {
    return new Map();
  }

  try {
    const output = execSync(
      `git log --name-only --pretty=format: -- .`,
      { cwd: rootDir, encoding: "utf-8" }
    );
    const lines = output.split("\n").filter((line) => line.trim());
    const counts = new Map<string, number>();
    for (const file of lines) {
      const normalized = file.replace(/\\/g, "/");
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}
