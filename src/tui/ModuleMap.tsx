import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { relative } from "path";
import type { ModuleGraph } from "../utils/code_parser.js";

interface ModuleMapProps {
  moduleGraph: ModuleGraph;
  rootDir: string;
  onBack?: () => void;
}

/**
 * Renders a tree of important components (files) connected by arrows.
 * Uses import-based dependencies for reliable visualization.
 */
export function ModuleMap({ moduleGraph, rootDir, onBack }: ModuleMapProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { files, imports } = moduleGraph;
  const relFiles = files.map((f) => relative(rootDir, f));
  const outgoingByFile = new Map<string, Array<{ to: string; spec: string }>>();
  for (const imp of imports) {
    const from = relative(rootDir, imp.fromFile);
    const to = relative(rootDir, imp.toFile);
    if (!outgoingByFile.has(from)) outgoingByFile.set(from, []);
    outgoingByFile.get(from)!.push({ to, spec: imp.specifier });
  }

  // Sort: files with most imports first (most "important" / central)
  const byImportCount = [...relFiles].sort((a, b) => {
    const aOut = (outgoingByFile.get(a)?.length ?? 0) + relFiles.filter((f) => outgoingByFile.get(f)?.some((x) => x.to === a)).length;
    const bOut = (outgoingByFile.get(b)?.length ?? 0) + relFiles.filter((f) => outgoingByFile.get(f)?.some((x) => x.to === b)).length;
    return bOut - aOut;
  });

  const displayList = byImportCount.slice(0, 15);
  const selected = displayList[Math.min(selectedIdx, Math.max(0, displayList.length - 1))] ?? displayList[0] ?? "";

  useInput((_, key) => {
    if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIdx((i) => Math.min(displayList.length - 1, i + 1));
  });

  const deps = outgoingByFile.get(selected) ?? [];

  if (displayList.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">Project Map</Text>
        <Text dimColor>No source files found.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Import dependencies</Text>
      <Text dimColor>↑↓ select</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Components (by importance)</Text>
        {displayList.map((file, i) => {
          const isSelected = i === selectedIdx;
          const depCount = outgoingByFile.get(file)?.length ?? 0;
          return (
            <Box key={file}>
              <Text color={isSelected ? "yellow" : "white"} bold={isSelected}>
                {isSelected ? "▶ " : "  "}
                {file}
              </Text>
              <Text dimColor> ({depCount} imports)</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {selected} →
        </Text>
        {deps.length === 0 ? (
          <Text dimColor>  (no local imports)</Text>
        ) : (
          deps.map(({ to, spec }) => (
            <Text key={to}>
              {"  "}
              <Text color="green">→</Text> {to}
              <Text dimColor> ({spec})</Text>
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}
