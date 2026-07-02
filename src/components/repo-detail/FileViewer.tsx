import { useState, useEffect, useMemo } from 'react';
import type { BlobResult } from '../../lib/api';
import { shortSha } from '../../lib/api';
import { getShikiLangFromPath, isMarkdownPath } from '../../lib/lang';
import { extractTocHeadings } from '../../lib/toc';
import { useShortcut } from '../../hooks/useShortcuts';
import { TocRail } from './TocRail';
import { CopyButton } from '../ui/CopyButton';
import { Pill } from '../ui/Pill';
import { MicroLabel } from '../ui/MicroLabel';
import { Skeleton } from '../ui/Skeleton';
import { MarkdownView } from './MarkdownView';
import { CodeView } from './CodeView';

interface FileViewerProps {
  owner: string;
  name: string;
  path: string;
  blob: BlobResult | null;
  loading: boolean;
  error: string | null;
  view: 'preview' | 'code';
  /** HEAD commit hash — shown as context; the blob API always serves HEAD */
  headSha?: string;
  onBack: () => void;
  onSetView: (v: 'preview' | 'code') => void;
  onForce: () => void;
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {children}
    </div>
  );
}

/** Pill-styled plain anchor — raw blob URLs must bypass the SPA router. */
function RawLink({ href, children, 'aria-label': ariaLabel }: {
  href: string;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={ariaLabel}
      className="inline-flex items-center h-7 px-2.5 text-[10px] font-medium uppercase tracking-[0.15em]
        border border-border rounded-[2px] text-muted-foreground select-none flex-shrink-0
        hover:border-dim hover:text-foreground transition-colors
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
    >
      {children}
    </a>
  );
}

function MarkdownPreview({ owner, name, path, content }: {
  owner: string;
  name: string;
  path: string;
  content: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const basePath = path.includes('/') ? path.split('/').slice(0, -1).join('/') : undefined;
    // Lazy chunk: the marked/shiki/dompurify stack stays out of the entry bundle
    import('../../lib/markdown')
      .then(({ renderMarkdown }) => renderMarkdown(content, { owner, name, basePath }))
      .then(result => {
        if (!cancelled) setHtml(result);
      });
    return () => { cancelled = true; };
  }, [owner, name, path, content]);

  // Scroll to #heading-id once rendered (native hash scroll misses async mounts)
  useEffect(() => {
    if (html === null) return;
    const hash = window.location.hash.slice(1);
    if (hash && !/^L\d+$/.test(hash)) {
      document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: 'start' });
    }
  }, [html]);

  const headings = useMemo(() => (html ? extractTocHeadings(html) : []), [html]);

  if (html === null) {
    return (
      <div className="p-4 sm:p-6 space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  return (
    <div className="flex gap-8 p-4 sm:p-6">
      <MarkdownView html={html} className="min-w-0 flex-1 max-w-[72ch]" />
      {headings.length >= 3 && <TocRail headings={headings} />}
    </div>
  );
}

export function FileViewer({
  owner, name, path, blob, loading, error, view, headSha, onBack, onSetView, onForce,
}: FileViewerProps) {
  const basename = path.split('/').pop() ?? path;
  const markdown = isMarkdownPath(path);
  const lang = getShikiLangFromPath(path);
  const lineCount = blob?.kind === 'text' && blob.content !== undefined
    ? blob.content.split('\n').length
    : null;
  const showsCode = blob?.kind === 'text' && !(markdown && view === 'preview');

  // Soft-wrap preference persists across sessions
  const [wrap, setWrap] = useState(() => localStorage.getItem('code-wrap') === '1');
  const toggleWrap = () => {
    setWrap(w => {
      localStorage.setItem('code-wrap', w ? '0' : '1');
      return !w;
    });
  };

  // `y` copies the canonical file URL (incl. any #L range). The blob API has
  // no ref/sha parameter — it always serves HEAD — so a true SHA-pinned
  // permalink cannot resolve; copying the live URL is the honest option.
  const [linkCopied, setLinkCopied] = useState(false);
  useShortcut('y', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1600);
    }).catch(() => {});
  });

  return (
    <div className="overflow-hidden border border-border max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 min-h-10 py-1.5 border-b border-border bg-surface flex-wrap">
        <button
          onClick={onBack}
          className="micro-label hover:text-foreground transition-colors duration-100 flex-shrink-0 cursor-pointer
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
        >
          ← back
        </button>
        <span className="text-dim text-[12px] flex-shrink-0">/</span>
        <span className="text-[12px] sm:text-[13px] text-foreground truncate min-w-0">{path}</span>
        {lang && !markdown && <MicroLabel className="flex-shrink-0 max-sm:hidden">{lang}</MicroLabel>}
        {headSha && (
          <span className="text-[11px] text-dim flex-shrink-0 max-md:hidden" title="content served at HEAD">
            @ {shortSha(headSha)}
          </span>
        )}

        <span className="flex-1" />

        <span aria-live="polite" className="flex-shrink-0">
          {linkCopied && <span className="text-[11px] text-warm-text">link copied</span>}
        </span>
        {blob && (
          <span className="text-[11px] tabular-nums text-dim flex-shrink-0 max-sm:hidden">
            {lineCount !== null ? `${lineCount.toLocaleString()} lines · ${blob.sizeLabel}` : blob.sizeLabel}
          </span>
        )}
        {showsCode && (
          <Pill onClick={toggleWrap} active={wrap} aria-pressed={wrap}>wrap</Pill>
        )}
        {markdown && blob?.kind === 'text' && (
          <span role="group" aria-label="view mode" className="flex gap-1 flex-shrink-0">
            <Pill onClick={() => onSetView('preview')} active={view === 'preview'}>preview</Pill>
            <Pill onClick={() => onSetView('code')} active={view === 'code'}>code</Pill>
          </span>
        )}
        {blob?.kind === 'text' && blob.content !== undefined && (
          <CopyButton value={blob.content} label="raw" className="flex-shrink-0" />
        )}
        {blob && <RawLink href={blob.url} aria-label="open raw file">raw ↗</RawLink>}
      </div>

      {/* Body */}
      {loading && (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <p className="m-0 text-[13px] text-muted-foreground animate-pulse">loading…</p>
        </div>
      )}

      {error && !loading && (
        <CenteredPanel>
          <p className="m-0 text-[13px] text-destructive">{error}</p>
        </CenteredPanel>
      )}

      {!loading && !error && blob && (
        blob.kind === 'text' && blob.content !== undefined ? (
          markdown && view === 'preview' ? (
            <MarkdownPreview key={path} owner={owner} name={name} path={path} content={blob.content} />
          ) : (
            <CodeView key={path} content={blob.content} path={path} wrap={wrap} />
          )
        ) : blob.kind === 'image' ? (
          <div className="p-6 text-center">
            <img
              src={blob.url}
              alt={basename}
              loading="lazy"
              className="inline-block max-w-full border border-border-inner"
            />
          </div>
        ) : blob.kind === 'binary' ? (
          <CenteredPanel>
            <p className="m-0 text-[13px] text-muted-foreground">binary file · {blob.sizeLabel}</p>
            <RawLink href={blob.url} aria-label="download raw file">download raw ↗</RawLink>
          </CenteredPanel>
        ) : (
          <CenteredPanel>
            <p className="m-0 text-[13px] text-muted-foreground">file too large to display · {blob.sizeLabel}</p>
            <div className="flex gap-2">
              <RawLink href={blob.url} aria-label="view raw file">view raw ↗</RawLink>
              <Pill onClick={onForce}>load anyway</Pill>
            </div>
          </CenteredPanel>
        )
      )}
    </div>
  );
}
