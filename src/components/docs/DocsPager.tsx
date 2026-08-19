import { Link } from 'react-router-dom';

interface PagerDoc {
  slug: string;
  title: string;
}

interface DocsPagerProps {
  previous?: PagerDoc;
  next?: PagerDoc;
}

/**
 * Previous/next at the foot of a document.
 *
 * The four documents are meant to be read in order — install, then operate,
 * then the protocol underneath, then run your own node — and without a pager
 * the only way to continue is to go back up to the sidebar.
 */
export function DocsPager({ previous, next }: DocsPagerProps) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="document"
      className="mt-14 grid gap-3 border-t border-border pt-6 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          to={`/docs/${previous.slug}`}
          className="group flex flex-col gap-1 rounded-[var(--radius)] border border-border px-4 py-3 transition-colors hover:border-foreground/40 hover:bg-surface-secondary"
        >
          <span className="text-[11.5px] text-muted">← Previous</span>
          <span className="text-[14px] font-medium text-foreground">{previous.title}</span>
        </Link>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}

      {next && (
        <Link
          to={`/docs/${next.slug}`}
          className="group flex flex-col gap-1 rounded-[var(--radius)] border border-border px-4 py-3 text-right transition-colors hover:border-foreground/40 hover:bg-surface-secondary sm:col-start-2"
        >
          <span className="text-[11.5px] text-muted">Next →</span>
          <span className="text-[14px] font-medium text-foreground">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
