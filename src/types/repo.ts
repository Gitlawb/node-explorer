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
  author?: string;
  /** ISO timestamp kept for activity bucketing */
  dateRaw?: string;
}

export interface Repository {
  id: string;
  owner: string;
  name: string;
  description: string;
  branch: string;
  updatedAt: string;
  createdAt: string;
  stars: number;
  visibility: 'public' | 'private';
  isMirror: boolean;
  latestCommit?: RepoCommit;
  commits: RepoCommit[];
  files: RepoFile[];
  cloneUrl: string;
  /** ISO timestamps kept for client-side sorting */
  updatedAtRaw: string;
  createdAtRaw: string;
}
