import ts from "typescript";
import fs from "fs";
import path from "path";
import { relative } from "path";
import { minimatch } from "minimatch";

/** File-level import: source file imports target file */
export type ModuleImport = {
  fromFile: string;
  toFile: string;
  specifier: string; // imported item
};

/** Module graph: files as nodes, imports as edges */
export type ModuleGraph = {
  files: string[];
  imports: ModuleImport[];
};

/**
 * Resolve relative import specifier to an actual file path from the files list.
 */
function resolveImportPath(fromFile: string, spec: string, files: string[]): string | null {
  const dir = path.dirname(fromFile);
  const candidate = path.resolve(dir, spec);
  if (files.includes(candidate)) return candidate;
  const hasExt = /\.(ts|tsx|js|jsx)$/.test(spec);
  if (!hasExt) {
    for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
      const p = candidate + ext;
      if (files.includes(p)) return p;
    }
  }
  const base = path.basename(spec, path.extname(spec));
  const specDir = path.resolve(dir, path.dirname(spec));
  for (const f of files) {
    const norm = path.normalize(f);
    if (path.basename(norm, path.extname(norm)) === base && path.dirname(norm) === specDir) return f;
  }
  return null;
}

/**
 * Parse import statements to build a file-level module graph.
 * Returns files and their import relationships (reliable, no type-checker needed).
 */
export function parseModuleGraph(rootDir: string, exclude: string[] = []): ModuleGraph {
  const files = getSourceFiles(rootDir, rootDir, exclude);
  const imports: ModuleImport[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const spec = moduleSpecifier.text;
          if (spec.startsWith(".")) {
            const resolved = resolveImportPath(filePath, spec, files);
            if (resolved) {
              const name = node.importClause?.name?.getText(sourceFile)
                ?? (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
                  ? node.importClause.namedBindings.elements.map((e) => e.name.getText(sourceFile)).join(", ")
                  : "*");
              imports.push({ fromFile: filePath, toFile: resolved, specifier: name });
            }
          }
        }
      }
    });
  }

  return { files, imports };
}

function isPathExcluded(relPath: string, exclude: string[]): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  return exclude.some((pattern) => minimatch(normalized, pattern, { matchBase: true }));
}

function getSourceFiles(dir: string, rootDir: string, exclude: string[]): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relPath = relative(rootDir, filePath);

    if (stat && stat.isDirectory()) {
      if (!isPathExcluded(relPath, exclude)) {
        results = results.concat(getSourceFiles(filePath, rootDir, exclude));
      }
    } else {
      if (/\.(ts|tsx|js|jsx)$/.test(filePath) && !isPathExcluded(relPath, exclude)) {
        results.push(filePath);
      }
    }
  });

  return results;
}