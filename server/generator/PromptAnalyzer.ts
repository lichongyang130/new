export interface PromptAnalysis {
  framework: string;
  features: string[];
  components: string[];
}

export class PromptAnalyzer {
  analyze(prompt: string): PromptAnalysis {
    return {
      framework: 'react',
      features: [prompt],
      components: []
    };
  }
}
