import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  items: Array<{ key: string; label: string }>;
}

export function StatusBar({ items }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      {items.map((item, i) => (
        <Box key={item.key} marginRight={2}>
          <Text dimColor>{item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
