import React from "react";
import { ThemeProvider as InkThemeProvider, extendTheme, defaultTheme } from "@inkjs/ui";

const sherlockTheme = extendTheme(defaultTheme, {
  components: {
    Select: {
      styles: {
        container: () => ({ flexDirection: "column" as const }),
        option: ({ isFocused }: { isFocused: boolean }) => ({
          gap: 1,
          paddingLeft: isFocused ? 0 : 2,
        }),
        focusIndicator: () => ({ color: "cyan" }),
        selectedIndicator: () => ({ color: "cyan" }),
        label: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) => ({
          color: isFocused || isSelected ? "white" : "gray",
          bold: isFocused,
        }),
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(InkThemeProvider, { theme: sherlockTheme }, children);
}
