import { useState, useEffect, useMemo } from 'react';
import type { RepoFile } from '../../types/repo';
import { getBlob } from '../../lib/api';
import { findReadmeName } from '../../lib/lang';
import { extractTocHeadings } from '../../lib/toc';
import { Skeleton } from '../ui/Skeleton';
import { MicroLabel } from '../ui/MicroLabel';
import { MarkdownView } from './MarkdownView';
import { TocRail } from './TocRail';

interface ReadmePanelProps {
  owner: string;
  name: string;
  /** Directory being listed ('' = repo root) */
  dirPath: string;
  entries: RepoFile[];
}

/**
 * README preview below the file list. Mount with a key of `${repoId}:${dirPath}`
 * so navigation resets state by remount. A failed README must never break the
 * code tab — every failure path collapses silently.
 */
export function ReadmePanel({ owner, name, dirPath, entries }: ReadmePanelProps) {
  const readmeName = findReadmeName(entries);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'failed'; html?: string }>({
    status: 'loading',
  });

  useEffect(() => {
    if (!readmeName) return;
    const ctrl = new AbortController();
    const fullPath = dirPath ? `${dirPath}/${readmeName}` : readmeName;
    getBlob(owner, name, fullPath, { signal: ctrl.signal })
      .then(async blob => {
        if (ctrl.signal.aborted) return;
        if (blob.kind !== 'text' || !blob.content) {
          setState({ status: 'failed' });
          return;
        }
        // Lazy chunk: the marked/shiki/dompurify stack stays out of the entry bundle
        const { renderMarkdown } = await import('../../lib/markdown');
        const html = await renderMarkdown(blob.content, { owner, name, basePath: dirPath || undefined });
        if (!ctrl.signal.aborted) setState({ status: 'ready', html });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: 'failed' });
      });
    return () => ctrl.abort();
  }, [owner, name, dirPath, readmeName]);

  const headings = useMemo(
    () => (state.html ? extractTocHeadings(state.html) : []),
    [state.html],
  );

  if (!readmeName || state.status === 'failed') return null;

  return (
    <section className="mt-6 border border-border">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-10 border-b border-border bg-surface">
        <span aria-hidden="true" className="text-[8px] leading-none text-warm select-none">◆</span>
        <MicroLabel>{readmeName}</MicroLabel>
      </div>
      {state.status === 'loading' ? (
        <div className="p-4 sm:p-6 space-y-3" aria-busy="true" aria-label="loading readme">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <div className="flex gap-8 p-4 sm:p-6">
          <MarkdownView html={state.html ?? ''} className="min-w-0 flex-1 max-w-[72ch]" />
          {headings.length >= 3 && <TocRail headings={headings} />}
        </div>
      )}
    </section>
  );
}
