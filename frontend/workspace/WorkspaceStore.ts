export interface WorkspaceState {
  prompt:string;
  previewUrl?:string;
  files:string[];
}

export class WorkspaceStore {
  state:WorkspaceState={prompt:'',files:[]};

  update(next:Partial<WorkspaceState>) {
    this.state={...this.state,...next};
  }
}
