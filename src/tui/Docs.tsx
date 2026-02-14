import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "./components/Spinner.js";
import { OutputBox } from "./components/OutputBox.js";
import { indexRepo } from "../core/indexer.js";
import { buildContext } from "../core/context.js";
import { generateDocs } from "../core/ai/index.js";
import { saveDocsToOutput } from "../utils/output.js";
import type { CodeOpsConfig } from "../utils/config.js";

interface DocsProps {
  rootDir: string;
  config: CodeOpsConfig;
  onBack?: () => void;
}

export function Docs({ rootDir, config, onBack }: DocsProps) {
  const [status, setStatus] = useState<"indexing" | "generating" | "done" | "error">("indexing");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("indexing");
        const index = indexRepo(rootDir, config.exclude);
        if (cancelled) return;
        setStatus("generating");
        const context = buildContext(index, "docs");
        const markdown = await generateDocs(context, config.provider, config.model);
        if (cancelled) return;
        saveDocsToOutput(rootDir, markdown);
        setOutput(markdown);
        setStatus("done");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rootDir, config.exclude, config.provider, config.model]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {status === "error" && (
        <Box flexDirection="column" paddingY={1}>
          <Text color="red">Error: {error}</Text>
          {onBack && (
            <Text dimColor>Press any key to go back (handled by parent).</Text>
          )}
        </Box>
      )}

      {(status === "indexing" || status === "generating") && (
        <Box flexDirection="column" paddingY={1}>
          <Spinner
            label={
              status === "indexing"
                ? "Indexing repository..."
                : "Generating documentation..."
            }
          />
        </Box>
      )}

      {status === "done" && (
        <Box flexDirection="column" paddingY={1}>
          <Text dimColor>Saved to DOCS.md</Text>
          <OutputBox content={output} title="Generated DOCS.md" />
        </Box>
      )}
    </Box>
  );
}
