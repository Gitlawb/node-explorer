import { normalizeRepoPath } from './lang';

export interface RepoCodeTarget {
  path?: string | null;
  file?: string | null;
  view?: 'preview' | 'code' | null;
  force?: boolean;
}

const CODE_PARAMS = ['tab', 'path', 'file', 'view', 'force'] as const;

/**
 * Build the canonical query string for the repository code browser.
 *
 * File paths already contain their parent directory, so file URLs intentionally
 * carry only `file=`. Keeping one source of truth prevents stale `path=` values
 * from sending the breadcrumb and the blob request to different places.
 */
export function buildRepoCodeSearch(
  current: URLSearchParams,
  target: RepoCodeTarget = {},
): string {
  const next = new URLSearchParams(current);
  for (const key of CODE_PARAMS) next.delete(key);

  const file = normalizeRepoPath(target.file ?? '');
  const path = normalizeRepoPath(target.path ?? '');

  if (file) {
    next.set('file', file);
    if (target.view === 'code') next.set('view', 'code');
    if (target.force) next.set('force', '1');
  } else if (path) {
    next.set('path', path);
  }

  const query = next.toString();
  return query ? `?${query}` : '';
}
