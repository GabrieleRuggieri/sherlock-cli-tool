import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "./components/Spinner.js";
import { OutputBox } from "./components/OutputBox.js";
import { indexRepo } from "../core/indexer.js";
import { buildContext } from "../core/context.js";
import { generateBugs } from "../core/ai/index.js";
import { saveBugReportToOutput } from "../utils/output.js";
import type { CodeOpsConfig } from "../utils/config.js";

interface BugsProps {
  rootDir: string;
  config: CodeOpsConfig;
  onBack?: () => void;
}

export function Bugs({ rootDir, config, onBack }: BugsProps) {
  const [status, setStatus] = useState<"indexing" | "analyzing" | "done" | "error">("indexing");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("indexing");
        const index = indexRepo(rootDir, config.exclude);
        if (cancelled) return;
        setStatus("analyzing");
        const context = buildContext(index, "bugs");
        const report = await generateBugs(context, config.provider, config.model);
        if (cancelled) return;
        if (config.output.save_reports) {
          saveBugReportToOutput(rootDir, report);
        }
        setOutput(report);
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
  }, [rootDir, config.exclude, config.provider, config.model, config.output.save_reports]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {status === "error" && (
        <Box flexDirection="column" paddingY={1}>
          <Text color="red">Error: {error}</Text>
          {onBack && <Text dimColor>Press Esc to go back.</Text>}
        </Box>
      )}

      {(status === "indexing" || status === "analyzing") && (
        <Box flexDirection="column" paddingY={1}>
          <Spinner
            label={
              status === "indexing"
                ? "Indexing repository..."
                : "Analyzing for potential bugs..."
            }
          />
        </Box>
      )}

      {status === "done" && (
        <Box flexDirection="column" paddingY={1}>
          {config.output.save_reports && (
            <Text dimColor>Saved to BUGS.md</Text>
          )}
          <OutputBox content={output} title="Bug Report" />
        </Box>
      )}
    </Box>
  );
}
