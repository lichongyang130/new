export interface ProjectFile {
  path: string;
  content?: string;
}

export function FileExplorer({files}:{files:ProjectFile[]}) {
  return files;
}
