export interface PreviewBuildResult {
  success: boolean;
  previewUrl?: string;
}

export class PreviewBuilder {
  async build(projectPath: string): Promise<PreviewBuildResult> {
    return {
      success: true,
      previewUrl: `/preview/${projectPath}`
    };
  }
}
