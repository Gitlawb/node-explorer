import { Link } from 'react-router-dom';
import { Star, GitFork } from 'lucide-react';
import { shortDid, timeAgo } from '../../lib/api';
import type { ApiRepo } from '../../lib/api';
import { MagicCard } from '../ui/magic-card';
import { Skeleton } from '../ui/Skeleton';

/**
 * The repositories this node is serving.
 *
 * The overview previously ended on a list of ref-update lines — commit shas and
 * branch names, which say the network is moving but not what is on it. This
 * says what is actually hosted, which is the thing a visitor came to see.
 *
 * Every field is read from the repository record as the node returns it:
 * `star_count` and `forked_from` are real columns, so the star count and the
 * fork mark are facts rather than decoration, and both are omitted when they
 * carry nothing.
 */
interface RepoShowcaseProps {
  repos: ApiRepo[] | null;
  loading: boolean;
  /** Total repositories on the node, for the "browse all" line. */
  totalCount?: number;
}

export function RepoShowcase({ repos, loading, totalCount }: RepoShowcaseProps) {
  if (loading && !repos) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-border p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return <p className="m-0 text-[13px] text-muted">No repositories on this node yet.</p>;
  }

  return (
    <>
      {/* Two-up. This sits in the overview's main column beside a sidebar, not
          across the full page, so three would squeeze a did:key owner prefix
          and a description into about 240px. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {repos.slice(0, 6).map(repo => (
          <MagicCard
            key={repo.id}
            className="rounded-[var(--radius)] border border-border"
            gradientColor="var(--color-surface-secondary)"
            gradientFrom="var(--color-foreground)"
            gradientTo="var(--color-muted)"
            gradientOpacity={0.08}
          >
            <Link
              to={`/repos/${encodeURIComponent(repo.owner_did)}/${encodeURIComponent(repo.name)}`}
              className="flex h-full flex-col gap-2 p-4"
            >
              <span className="flex items-baseline gap-2 min-w-0">
                <span className="min-w-0 truncate font-mono text-[13.5px]">
                  <span className="text-muted">{shortDid(repo.owner_did)}/</span>
                  <span className="font-semibold text-foreground">{repo.name}</span>
                </span>
                {repo.forked_from && (
                  <GitFork
                    size={12}
                    aria-label="fork"
                    className="shrink-0 translate-y-px text-muted"
                  />
                )}
              </span>

              <p className="m-0 line-clamp-2 min-h-[2.4em] text-[12.5px] leading-snug text-muted">
                {repo.description ?? <span className="italic">No description</span>}
              </p>

              <span className="mt-auto flex items-center gap-3 pt-1 text-[11.5px] text-muted">
                <span className="font-mono">{repo.default_branch}</span>
                {repo.star_count > 0 && (
                  <span className="inline-flex items-center gap-1 tabular">
                    <Star size={11} aria-hidden="true" />
                    {repo.star_count}
                  </span>
                )}
                <span className="ml-auto tabular whitespace-nowrap">
                  {timeAgo(repo.updated_at)}
                </span>
              </span>
            </Link>
          </MagicCard>
        ))}
      </div>

      <Link
        to="/repos"
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"
      >
        Browse all{totalCount ? ` ${totalCount.toLocaleString()}` : ''} repositories
        <span aria-hidden="true">→</span>
      </Link>
    </>
  );
}
