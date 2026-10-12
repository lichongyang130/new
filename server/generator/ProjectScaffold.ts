export interface ScaffoldConfig {
  name: string;
  framework: string;
  language: string;
}

export interface ProjectStructure {
  files: string[];
  dependencies: string[];
}

export class ProjectScaffold {
  create(config: ScaffoldConfig): ProjectStructure {
    return {
      files: [`${config.name}/src/App.tsx`],
      dependencies: []
    };
  }
}
