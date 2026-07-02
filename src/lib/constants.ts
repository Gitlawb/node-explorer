// Server clamps limit to 200 (see node: api/repos.rs ListReposQuery) — options must not exceed it.
export const PER_PAGE_OPTIONS = [25, 50, 100, 200];
export const DEFAULT_PER_PAGE = 50;
