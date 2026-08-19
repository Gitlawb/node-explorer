import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, type To } from 'react-router-dom';
import type { BlobResult } from '../../lib/api';
import { shortSha } from '../../lib/api';
import { getShikiLangFromPath, isMarkdownPath } from '../../lib/lang';
import { extractTocHeadings } from '../../lib/toc';
import { useShortcut } from '../../hooks/useShortcuts';
import { TocRail } from './TocRail';
import { CopyButton } from '../ui/CopyButton';
import { Button } from '../register/controls';
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
  backTo: To;
  onSetView: (v: 'preview' | 'code') => void;
  onForce: () => void;
  onRetry: () => void;
  onOpenFinder?: () => void;
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {children}
    </div>
  );
}

function FileLoading() {
  return (
    <div className="p-4 sm:p-6" aria-busy="true" aria-label="loading file">
      <div className="space-y-3">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const probe = new window.Image();
    probe.onload = () => {
      setDimensions({ width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.onerror = () => setFailed(true);
    probe.src = src;
    return () => {
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src]);

  if (failed) {
    return (
      <CenteredPanel>
        <p className="m-0 text-[13px] text-muted">Image preview unavailable.</p>
        <RawLink href={src} aria-label="open raw image">open raw ↗</RawLink>
      </CenteredPanel>
    );
  }

  if (!dimensions) {
    return (
      <div className="p-6" aria-busy="true" aria-label="loading image preview">
        <Skeleton className="mx-auto aspect-video w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <img
        src={src}
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        className="inline-block h-auto max-w-full border border-separator"
      />
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
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-flex items-center h-7 px-2.5 text-[12px] font-medium
        border border-border rounded-[var(--radius)] text-muted select-none flex-shrink-0
        hover:border-muted hover:text-foreground transition-colors"
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
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const basePath = path.includes('/') ? path.split('/').slice(0, -1).join('/') : undefined;
    // Lazy chunk: the marked/shiki/dompurify stack stays out of the entry bundle
    import('../../lib/markdown')
      .then(({ renderMarkdown }) => renderMarkdown(content, { owner, name, basePath }))
      .then(result => {
        if (cancelled) return;
        setRenderFailed(false);
        setHtml(result);
      })
      .catch(() => {
        if (!cancelled) setRenderFailed(true);
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

  if (renderFailed) {
    return (
      <div className="p-6 text-center">
        <p className="m-0 text-[13px] text-muted">Preview unavailable. Open the code view instead.</p>
      </div>
    );
  }
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
      <MarkdownView html={html} className="min-w-0 flex-1" />
      {headings.length >= 3 && <TocRail headings={headings} />}
    </div>
  );
}

export function FileViewer({
  owner,
  name,
  path,
  blob,
  loading,
  error,
  view,
  headSha,
  backTo,
  onSetView,
  onForce,
  onRetry,
  onOpenFinder,
}: FileViewerProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const basename = path.split('/').pop() ?? path;
  const markdown = isMarkdownPath(path);
  const lang = getShikiLangFromPath(path);
  const lineCount = useMemo(
    () => blob?.kind === 'text' && blob.content !== undefined
      ? blob.content.split('\n').length
      : null,
    [blob],
  );
  const showsCode = blob?.kind === 'text' && !(markdown && view === 'preview');

  // Soft-wrap preference persists across sessions
  const [wrap, setWrap] = useState(() => {
    try {
      return localStorage.getItem('code-wrap') === '1';
    } catch {
      return false;
    }
  });
  const toggleWrap = () => {
    setWrap(w => {
      try {
        localStorage.setItem('code-wrap', w ? '0' : '1');
      } catch {
        // Storage can be unavailable in privacy-restricted contexts.
      }
      return !w;
    });
  };

  // `y` copies the canonical file URL (incl. any #L range). The blob API has
  // no ref/sha parameter — it always serves HEAD — so a true SHA-pinned
  // permalink cannot resolve; copying the live URL is the honest option.
  const [linkCopied, setLinkCopied] = useState(false);
  const copyResetRef = useRef<number | null>(null);
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      // Clipboard access may be denied outside a secure browser context.
    }
  }, []);

  useEffect(() => () => {
    if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current);
  }, []);

  useShortcut('y', e => {
    e.preventDefault();
    void copyLink();
  });

  // File navigation replaces the row that held keyboard focus. Move focus to
  // the new file title without changing the reader's scroll position.
  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [path]);

  return (
    <section aria-labelledby={titleId} className="scroll-mt-20 border border-border">
      {/* The toolbar is deliberately two-tiered: path context never competes
          with actions, and mobile wraps actions without breaking the filename. */}
      <div className="sticky top-14 z-20 border-b border-border bg-surface">
        <div className="flex min-h-10 min-w-0 items-center gap-2 px-4 py-1.5 sm:gap-3 sm:px-5">
          <Link
            to={backTo}
            className="shrink-0 rounded-[var(--radius-control)] px-1 text-[12px] font-medium text-muted
              hover:text-foreground transition-colors"
          >
            ← folder
          </Link>
          <span aria-hidden="true" className="shrink-0 text-[12px] text-muted">/</span>
          <h2
            ref={titleRef}
            id={titleId}
            tabIndex={-1}
            translate="no"
            title={path}
            className="m-0 min-w-0 truncate text-[12px] font-medium text-foreground
              focus-visible:!outline-none sm:text-[13px]"
          >
            {path}
          </h2>
          {lang && !markdown && <MicroLabel className="shrink-0 max-sm:hidden">{lang}</MicroLabel>}
          {headSha && (
            <span
              translate="no"
              className="shrink-0 text-[11px] text-muted max-md:hidden"
              title="content served at HEAD"
            >
              @ {shortSha(headSha)}
            </span>
          )}
        </div>

        <div className="flex min-h-10 items-center gap-3 border-t border-separator px-4 py-1.5 sm:px-5">
          <span className="shrink-0 text-[11px] tabular-nums text-muted" aria-live="polite">
            {loading
              ? 'loading…'
              : blob
                ? lineCount !== null
                  ? `${lineCount.toLocaleString()} lines · ${blob.sizeLabel}`
                  : blob.sizeLabel
                : ''}
          </span>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            {showsCode && (
              <Pill onClick={toggleWrap} active={wrap} aria-pressed={wrap}>wrap</Pill>
            )}
            {markdown && blob?.kind === 'text' && (
              <span role="group" aria-label="view mode" className="flex shrink-0 gap-1">
                <Pill onClick={() => onSetView('preview')} active={view === 'preview'}>preview</Pill>
                <Pill onClick={() => onSetView('code')} active={view === 'code'}>code</Pill>
              </span>
            )}
            {blob?.kind === 'text' && blob.content !== undefined && (
              <CopyButton
                value={blob.content}
                label="contents"
                srLabel="copy file contents"
                className="shrink-0"
              />
            )}
            <Button
              variant="tertiary"
              size="sm"
              onPress={copyLink}
              className="shrink-0"
              aria-label="copy link to file"
            >
              <span aria-live="polite">{linkCopied ? 'link copied' : 'copy link'}</span>
            </Button>
            {blob && <RawLink href={blob.url} aria-label="open raw file">raw ↗</RawLink>}
            {onOpenFinder && (
              <Pill onClick={onOpenFinder} className="shrink-0" aria-label="find file (t)">
                find file · t
              </Pill>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {loading && <FileLoading />}

      {error && !loading && (
        <CenteredPanel>
          <div>
            <p className="m-0 text-[13px] font-medium text-danger">couldn’t load {basename}</p>
            <p className="m-0 mt-1 text-[12px] text-muted">{error}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onPress={onRetry}>retry</Button>
            <Link
              to={backTo}
              className="inline-flex h-7 items-center rounded-[var(--radius-control)] px-2.5
                text-[12px] text-muted hover:text-foreground transition-colors"
            >
              back to folder
            </Link>
          </div>
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
          <ImagePreview key={blob.url} src={blob.url} alt={basename} />
        ) : blob.kind === 'binary' ? (
          <CenteredPanel>
            <p className="m-0 text-[13px] text-muted">binary file · {blob.sizeLabel}</p>
            <RawLink href={blob.url} aria-label="download raw file">download raw ↗</RawLink>
          </CenteredPanel>
        ) : (
          <CenteredPanel>
            <p className="m-0 text-[13px] text-muted">file too large to display · {blob.sizeLabel}</p>
            <div className="flex gap-2">
              <RawLink href={blob.url} aria-label="view raw file">view raw ↗</RawLink>
              <Pill onClick={onForce}>load anyway</Pill>
            </div>
          </CenteredPanel>
        )
      )}
    </section>
  );
}
