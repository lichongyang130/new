import type { KeyboardEvent } from "react";

export interface PromptInputProps {
  value: string;
  onChange(value: string): void;
  onSubmit?(): void;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}

export function PromptInput({ value, onChange, onSubmit, placeholder, rows = 3, ariaLabel }: PromptInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
    />
  );
}
