export interface PreviewDeployment {
  url: string;
  status: 'pending' | 'ready' | 'failed';
}

export class PreviewDeploymentService {
  async deploy(projectId: string): Promise<PreviewDeployment> {
    return {
      url: `https://preview.local/${projectId}`,
      status: 'ready'
    };
  }
}
