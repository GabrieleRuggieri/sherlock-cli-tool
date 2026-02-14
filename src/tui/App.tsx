import React, { useState, useCallback, useEffect } from "react";
import { parseModuleGraph } from "../utils/code_parser.js";
import { Box, Text, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Docs } from "./Docs.js";
import { Bugs } from "./Bugs.js";
import { ModuleMap } from "./ModuleMap.js";
import { Ask } from "./Ask.js";
import { FolderPicker } from "./FolderPicker.js";
import { Header } from "./components/Header.js";
import { StatusBar } from "./components/StatusBar.js";
import { ThemeProvider } from "./theme.js";
import { loadConfig } from "../utils/config.js";
import type { CodeOpsConfig } from "../utils/config.js";
import type { ModuleGraph } from "../utils/code_parser.js";

type Mode = "pick" | "menu" | "docs" | "bugs" | "map" | "ask";

interface AppProps {
  rootDir?: string;
  config?: CodeOpsConfig;
  initialMode?: string;
  initialQuestion?: string;
  initialPickPath?: string;
}

const MENU_OPTIONS = [
  { label: "  Docs     Generate documentation", value: "docs" },
  { label: "  Bugs     Detect potential issues", value: "bugs" },
  { label: "  Map      Project structure & deps", value: "map" },
  { label: "  Ask      Q&A on codebase", value: "ask" },
];

export default function App({
  rootDir: initialRootDir,
  config: initialConfig,
  initialMode,
  initialQuestion,
  initialPickPath,
}: AppProps) {
  const [rootDir, setRootDir] = useState<string | null>(initialRootDir ?? null);
  const [config, setConfig] = useState<CodeOpsConfig | null>(
    initialConfig ?? (initialRootDir ? loadConfig(initialRootDir) : null)
  );
  const [mode, setMode] = useState<Mode>(() => {
    if (!initialRootDir) return "pick";
    const m = initialMode?.toLowerCase();
    if (m === "docs" || m === "bugs" || m === "map" || m === "ask") return m;
    return "menu";
  });
  const [moduleGraph, setModuleGraph] = useState<ModuleGraph | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [gitStats, setGitStats] = useState<Array<{ file: string; count: number }>>([]);

  const handleFolderSelect = useCallback((path: string) => {
    setRootDir(path);
    setConfig(loadConfig(path));
    setMode("menu");
  }, []);

  useEffect(() => {
    if (!rootDir || !config || mode !== "map") return;
    const loadMapData = async () => {
      setLoadingMap(true);
      try {
        const graph = parseModuleGraph(rootDir, config.exclude);
        setModuleGraph(graph);
        const { getFileChangeStats } = await import("../core/git.js");
        const stats = getFileChangeStats(rootDir);
        const sorted = Array.from(stats.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([file, count]) => ({ file, count }));
        setGitStats(sorted);
      } catch (error) {
        console.error("Error loading map data:", error);
      } finally {
        setLoadingMap(false);
      }
    };
    loadMapData();
  }, [mode, rootDir, config]);

  const handleSelect = useCallback((value: string) => {
    setMode(value as Mode);
  }, []);

  const statusItems = [
    { key: "path", label: rootDir ? (rootDir.length > 40 ? "…" + rootDir.slice(-37) : rootDir) : "" },
    { key: "provider", label: config?.provider ?? "" },
    { key: "help", label: "↑↓ navigate  Enter select  Esc back  Ctrl+D quit" },
  ];

  if (mode === "pick") {
    return (
      <ThemeProvider>
        <Box flexDirection="column" flexGrow={1} padding={1}>
          <Header title="Sherlock" subtitle="Select the project folder to analyze" />
          <Box flexDirection="row" flexGrow={1} minHeight={10}>
            <FolderPicker
              initialPath={initialPickPath}
              onSelect={handleFolderSelect}
            />
          </Box>
          <QuitHandler onQuit={() => process.exit(0)} />
        </Box>
      </ThemeProvider>
    );
  }

  if (!rootDir || !config) return null;

  return (
    <ThemeProvider>
      <Box flexDirection="column" flexGrow={1} padding={1}>
        <Header
          title="Sherlock"
          subtitle={
            mode === "menu"
              ? "Codebase analysis"
              : mode === "docs"
                ? "Generate documentation"
                : mode === "bugs"
                  ? "Detect potential issues"
                  : mode === "map"
                    ? "Project structure"
                    : "Q&A on codebase"
          }
        />
        <Box flexDirection="row" flexGrow={1} minHeight={10}>
          {mode === "menu" && (
            <Box flexDirection="column" flexGrow={1}>
              <Box marginBottom={1}>
                <Text dimColor>Select a mode</Text>
              </Box>
              <Box
                borderStyle="single"
                borderColor="gray"
                paddingX={2}
                paddingY={1}
                flexGrow={1}
              >
                <Select
                  options={MENU_OPTIONS}
                  onChange={handleSelect}
                  visibleOptionCount={6}
                />
              </Box>
            </Box>
          )}

          {mode === "docs" && (
            <Box flexDirection="column" flexGrow={1}>
              <Box
                borderStyle="single"
                borderColor="gray"
                paddingX={2}
                paddingY={1}
                flexGrow={1}
              >
                <Docs rootDir={rootDir} config={config} />
              </Box>
            </Box>
          )}

          {mode === "bugs" && (
            <Box flexDirection="column" flexGrow={1}>
              <Box
                borderStyle="single"
                borderColor="gray"
                paddingX={2}
                paddingY={1}
                flexGrow={1}
              >
                <Bugs rootDir={rootDir} config={config} onBack={() => setMode("menu")} />
              </Box>
            </Box>
          )}

          {mode === "map" && (
            <Box flexDirection="column" flexGrow={1}>
              <Box
                borderStyle="single"
                borderColor="gray"
                paddingX={2}
                paddingY={1}
                flexGrow={1}
              >
              {loadingMap ? (
                <Text dimColor>Loading map...</Text>
              ) : moduleGraph ? (
                <>
                  <ModuleMap
                    moduleGraph={moduleGraph}
                    rootDir={rootDir}
                    onBack={() => setMode("menu")}
                  />
                  {gitStats.length > 0 && (
                    <Box flexDirection="column" marginTop={1} paddingX={1}>
                      <Text bold color="cyan">Most changed files</Text>
                      {gitStats.map(({ file, count }) => (
                        <Text key={file} dimColor>
                          {count} commits — {file}
                        </Text>
                      ))}
                    </Box>
                  )}
                </>
              ) : (
                <Text color="red">Failed to load map.</Text>
              )}
              </Box>
            </Box>
          )}

          {mode === "ask" && (
            <Box flexDirection="column" flexGrow={1}>
              <Box
                borderStyle="single"
                borderColor="gray"
                paddingX={2}
                paddingY={1}
                flexGrow={1}
              >
              <Ask
                rootDir={rootDir}
                config={config}
                initialQuestion={initialQuestion}
                onBack={() => setMode("menu")}
              />
              </Box>
            </Box>
          )}
        </Box>
        <Box marginTop={1}>
          <StatusBar items={statusItems} />
        </Box>
      </Box>
      <QuitHandler
        onQuit={() => process.exit(0)}
        onBack={mode !== "menu" ? () => setMode("menu") : undefined}
      />
    </ThemeProvider>
  );
}

function QuitHandler({
  onQuit,
  onBack,
}: {
  onQuit: () => void;
  onBack?: () => void;
}) {
  useInput((input, key) => {
    if (key.ctrl && input === "d") onQuit();
    if (key.escape && onBack) onBack();
  });
  return null;
}

export { App };
