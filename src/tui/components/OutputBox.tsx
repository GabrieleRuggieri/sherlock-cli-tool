import React from "react";
import { Box, Text } from "ink";

interface OutputBoxProps {
  content: string;
  title?: string;
}

export function OutputBox({ content, title }: OutputBoxProps) {
  const lines = content.split("\n");
  return (
    <Box flexDirection="column" paddingY={1}>
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">{title}</Text>
        </Box>
      )}
      <Box flexDirection="column">
        {lines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
