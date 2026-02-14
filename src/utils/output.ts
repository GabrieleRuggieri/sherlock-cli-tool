import { writeFileSync } from "fs";
import { join } from "path";

const DOCS_FILENAME = "DOCS.md";
const BUGS_FILENAME = "BUGS.md";

/**
 * Write generated documentation to DOCS.md in the target repo root.
 */
export function saveDocsToOutput(rootDir: string, content: string): void {
  const filePath = join(rootDir, DOCS_FILENAME);
  writeFileSync(filePath, content, "utf-8");
}

/**
 * Write bug report to BUGS.md in the target repo root.
 */
export function saveBugReportToOutput(rootDir: string, content: string): void {
  const filePath = join(rootDir, BUGS_FILENAME);
  writeFileSync(filePath, content, "utf-8");
}
