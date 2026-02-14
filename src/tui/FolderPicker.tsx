import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { listDirectories, getHomeDir } from "../utils/folder_picker.js";

interface FolderPickerProps {
  initialPath?: string;
  onSelect: (path: string) => void;
  onBack?: () => void;
}

const USE_THIS_FOLDER = "__use_this_folder__";

export function FolderPicker({
  initialPath,
  onSelect,
  onBack,
}: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState(
    () => initialPath || getHomeDir()
  );
  const [entries, setEntries] = useState<Array<{ name: string; path: string }>>(
    () => listDirectories(currentPath)
  );
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setEntries(listDirectories(currentPath));
    setSelectedIdx(0);
  }, [currentPath]);

  const displayList = [
    ...entries,
    { name: "▸ Use this folder", path: USE_THIS_FOLDER },
  ];
  const maxIdx = Math.max(0, displayList.length - 1);
  const clampedIdx = Math.min(Math.max(selectedIdx, 0), maxIdx);

  const handleConfirm = useCallback(() => {
    const chosen = displayList[clampedIdx];
    if (!chosen) return;
    if (chosen.path === USE_THIS_FOLDER) {
      onSelect(currentPath);
    } else {
      setCurrentPath(chosen.path);
    }
  }, [clampedIdx, displayList, currentPath, onSelect]);

  useInput((input, key) => {
    if (key.upArrow) setSelectedIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIdx((i) => Math.min(maxIdx, i + 1));
    if (key.return) handleConfirm();
    if (key.escape && onBack) onBack();
  });

  const shortenPath = (p: string) => {
    if (p.length <= 55) return p;
    return "…" + p.slice(-52);
  };

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Select project folder
        </Text>
        <Text dimColor> Navigate with ↑↓  Enter to open/select</Text>
      </Box>
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
        flexGrow={1}
      >
        <Box flexDirection="column">
          <Text dimColor>Current: {shortenPath(currentPath)}</Text>
          <Box marginTop={1} flexDirection="column">
            {displayList.map((entry, i) => {
              const isSelected = i === clampedIdx;
              const isAction = entry.path === USE_THIS_FOLDER;
              return (
                <Box key={entry.path}>
                  <Text
                    color={
                      isAction
                        ? isSelected
                          ? "green"
                          : "gray"
                        : isSelected
                          ? "cyan"
                          : "white"
                    }
                    bold={isSelected}
                  >
                    {isSelected ? "▶ " : "  "}
                    {entry.name === ".." ? "⬆  .." : entry.name}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {onBack ? "Esc: back  " : ""}Ctrl+D: quit
        </Text>
      </Box>
    </Box>
  );
}
