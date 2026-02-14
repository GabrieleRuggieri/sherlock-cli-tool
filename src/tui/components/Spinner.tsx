import React from "react";
import { Spinner as InkSpinner } from "@inkjs/ui";

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Loading..." }: SpinnerProps) {
  return <InkSpinner label={label} />;
}
