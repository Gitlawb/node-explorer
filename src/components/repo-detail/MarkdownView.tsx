import { useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface MarkdownViewProps {
  html: string;
  className?: string;
}

/**
 * Renders sanitized markdown HTML. Relative repo links (marked with
 * data-repo-link by renderMarkdown) are intercepted for SPA navigation —
 * their hrefs are plain `?tab=code&file=…` query URLs, so cmd/middle-click
 * and open-in-new-tab still work natively.
 */
export function MarkdownView({ html, className }: MarkdownViewProps) {
  const [, setSearchParams] = useSearchParams();

  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const anchor = (e.target as Element).closest('a');
    if (!anchor || !anchor.dataset.repoLink) return;
    const href = anchor.getAttribute('href') ?? '';
    if (!href.startsWith('?')) return;
    e.preventDefault();
    const [query, hash] = href.slice(1).split('#', 2);
    setSearchParams(new URLSearchParams(query));
    if (hash) window.location.hash = hash;
  };

  return (
    <div
      className={cn('markdown-gl', className)}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
