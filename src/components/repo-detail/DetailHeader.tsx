import type { Repository } from '../../types/repo';
import { shortDid, truncateDid } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';
import { Seal } from '../register/primitives';
import { DotPattern } from '../ui/dot-pattern';
import { AuroraText } from '../ui/aurora-text';
import { GitFork, Star, Clock } from 'lucide-react';

/* Aurora ramp, read from theme tokens rather than fixed hexes: this text is
   painted through background-clip with a transparent colour, so a hardcoded
   white ramp is invisible on the light theme's white ground. */
const AURORA = [
  'var(--ramp-1)',
  'var(--ramp-2)',
  'var(--ramp-3)',
  'var(--ramp-4)',
];

interface DetailHeaderProps {
  repo: Repository;
}

/**
 * The repository header.
 *
 * Carries the showcase language — patterned ground, the repository name
 * accented — while the facts underneath stay dense and scannable.
 *
 * Fields holding this node's default value (public, `main`) are not printed:
 * effectively every repository here is both, so showing them on every page
 * spends the slot beside the name on nothing and trains the reader to skip the
 * place an exception would appear.
 */
export function DetailHeader({ repo }: DetailHeaderProps) {
  const fullDid = repo.owner;
  const offBranch = repo.branch && repo.branch !== 'main' && repo.branch !== 'master';
  const restricted = repo.visibility !== 'public';

  return (
    <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-6 pb-6">
      <DotPattern
        width={24}
        height={24}
        cr={1}
        className="absolute inset-0 h-full w-full fill-border/50
          [mask-image:radial-gradient(380px_circle_at_10%_0%,white,transparent)]"
      />

      <div className="relative min-w-0">
        <h1 className="m-0 text-[26px] sm:text-[34px] font-semibold tracking-tight leading-tight break-words">
          <span className="text-muted font-normal">{shortDid(repo.owner)}/</span>
          <AuroraText speed={1.4} colors={AURORA}>{repo.name}</AuroraText>
        </h1>

        {(offBranch || restricted || repo.isMirror) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {restricted && <Seal label={repo.visibility} tone="attention" />}
            {offBranch && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-[2px] text-[12px] text-muted">
                default: {repo.branch}
              </span>
            )}
            {repo.isMirror && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-[2px] text-[12px] text-muted">
                <GitFork size={11} />
                mirrored from a peer
              </span>
            )}
          </div>
        )}

        {repo.description && (
          <p className="m-0 mt-3 text-[15px] leading-relaxed max-w-[72ch] text-muted">
            {repo.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-x-5 gap-y-2 flex-wrap text-[13px] text-muted">
          {repo.stars > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Star size={13} className="text-attention" />
              <span className="text-foreground font-medium tabular">{repo.stars}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            Updated <span className="text-foreground">{repo.updatedAt}</span>
          </span>
          <span>
            Created <span className="text-foreground">{repo.createdAt}</span>
          </span>
          <span className="inline-flex items-center gap-2 min-w-0">
            <code
              title={fullDid}
              className="font-mono text-[12px] truncate max-w-[22ch] sm:max-w-none"
            >
              {truncateDid(fullDid)}
            </code>
            <CopyButton value={fullDid} label="owner did" />
          </span>
        </div>
      </div>
    </div>
  );
}
