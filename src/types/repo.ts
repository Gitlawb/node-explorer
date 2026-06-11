export interface RepoFile {
  name: string;
  size: string;
  type: 'file' | 'dir';
}

export interface RepoCommit {
  hash: string;
  shortHash: string;
  message: string;
  time: string;
}

export interface Repository {
  id: number;
  owner: string;
  name: string;
  description: string;
  branch: string;
  updatedAt: string;
  createdAt: string;
  stars: number;
  visibility: 'public' | 'private';
  isMirror: boolean;
  drift: { agree: number; total: number };
  latestCommit: RepoCommit;
  files: RepoFile[];
}
