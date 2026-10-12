export interface GenerationStep {
  name: string;
  status: string;
}

export function GenerationTimeline({steps}:{steps:GenerationStep[]}) {
  return steps;
}
