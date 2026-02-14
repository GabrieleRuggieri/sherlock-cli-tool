import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { Spinner } from "./components/Spinner.js";
import { OutputBox } from "./components/OutputBox.js";
import { indexRepo } from "../core/indexer.js";
import { buildContext } from "../core/context.js";
import { generateAskStream } from "../core/ai/index.js";
import type { CodeOpsConfig } from "../utils/config.js";

interface AskProps {
  rootDir: string;
  config: CodeOpsConfig;
  initialQuestion?: string;
  onBack?: () => void;
}

export function Ask({ rootDir, config, initialQuestion, onBack }: AskProps) {
  const [phase, setPhase] = useState<"input" | "loading" | "done" | "error">(
    initialQuestion ? "loading" : "input"
  );
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialQuestion) return;
    let cancelled = false;
    (async () => {
      try {
        const index = indexRepo(rootDir, config.exclude);
        if (cancelled) return;
        const context = buildContext(index, "ask", initialQuestion);
        setPhase("loading");
        let full = "";
        for await (const chunk of generateAskStream(
          context,
          initialQuestion,
          config.provider,
          config.model
        )) {
          if (cancelled) return;
          full += chunk;
          setAnswer(full);
        }
        if (cancelled) return;
        setPhase("done");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialQuestion, rootDir, config.exclude, config.provider, config.model]);

  const handleSubmit = async (q: string) => {
    if (!q.trim()) return;
    setQuestion(q.trim());
    setPhase("loading");
    setAnswer("");
    try {
      const index = indexRepo(rootDir, config.exclude);
      const context = buildContext(index, "ask", q.trim());
      let full = "";
      for await (const chunk of generateAskStream(
        context,
        q.trim(),
        config.provider,
        config.model
      )) {
        full += chunk;
        setAnswer(full);
      }
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  useInput((input, key) => {
    if ((phase === "done" || phase === "error") && input.toLowerCase() === "n") {
      setPhase("input");
      setQuestion("");
      setAnswer("");
      setError(null);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      {phase === "input" && (
        <Box flexDirection="column" paddingY={1}>
          <Text dimColor>Ask a question about the codebase. Enter to submit, Esc to go back, Ctrl+D to quit.</Text>
          <Box marginTop={1}>
            <TextInput
              placeholder="e.g. How does authentication work?"
              onSubmit={handleSubmit}
            />
          </Box>
          {onBack && <Text dimColor>Press Esc to go back.</Text>}
        </Box>
      )}

      {phase === "loading" && (
        <Box flexDirection="column" paddingY={1}>
          {answer ? (
            <>
              <Text dimColor>Question: {question}</Text>
              <OutputBox content={answer} title="Answer" />
              <Text dimColor>…</Text>
            </>
          ) : (
            <Spinner label="Analyzing codebase and generating answer..." />
          )}
        </Box>
      )}

      {phase === "error" && (
        <Box flexDirection="column" paddingY={1}>
          <Text color="red">Error: {error}</Text>
          <Text dimColor>{onBack ? "N: ask another  Esc: back" : "N: ask another"}</Text>
        </Box>
      )}

      {phase === "done" && (
        <Box flexDirection="column" paddingY={1}>
          <Text dimColor>Question: {question}</Text>
          <OutputBox content={answer} title="Answer" />
          <Text dimColor>{onBack ? "N: ask another  Esc: back" : "N: ask another"}</Text>
        </Box>
      )}
    </Box>
  );
}
