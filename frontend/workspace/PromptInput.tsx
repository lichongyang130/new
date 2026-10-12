export interface PromptInputProps {
  value: string;
  onChange(value: string): void;
}

export function PromptInput(props: PromptInputProps) {
  return {
    type: 'PromptInput',
    value: props.value
  };
}
