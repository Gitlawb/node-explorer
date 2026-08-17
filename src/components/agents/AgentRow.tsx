import type { ApiAgent } from '../../lib/api';
import { shortDid, didKeySegment, trustTier, timeAgo, formatDate } from '../../lib/api';
import { cn } from '../../lib/utils';
import { CopyButton } from '../ui/CopyButton';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface AgentRowProps {
  agent: ApiAgent;
  index: number;
}

/**
 * One registered agent.
 *
 * Two fields are deliberately not given prominence. `status` is `active` for
 * every agent on this node, so a badge for it would appear on all of them and
 * mean nothing; it prints only when it departs from that. Trust is shown as a
 * labelled percentage with its tier rather than a gauge — 88% of agents sit at
 * 0.05, so a ring renders near-empty and near-identical down the whole page
 * while taking the most visual weight on the card.
 */
export function AgentRow({ agent }: AgentRowProps) {
  const tier = trustTier(agent.trust_score);
  const pct = Math.round(agent.trust_score * 100);
  const unusualStatus = agent.status !== 'active';

  return (
    <li className="list-none border-b border-separator last:border-b-0 px-1 py-3 hover:bg-surface-secondary transition-colors">
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <span className="font-mono text-[14px] font-semibold text-foreground">
          {shortDid(agent.did)}
        </span>
        <CopyButton value={agent.did} label="DID" />

        {unusualStatus && (
          <span className="rounded-full border border-attention/50 px-2 py-[1px] text-[12px] text-attention">
            {agent.status}
          </span>
        )}

        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-muted">
          {/* A short bar reads the score at a glance without claiming a
              precision the tiers do not have. */}
          <span
            aria-hidden="true"
            className="hidden sm:block h-1 w-14 bg-separator overflow-hidden"
          >
            <span
              className={cn('block h-full', pct >= 70 ? 'bg-success' : 'bg-foreground/50')}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </span>
          <span className="tabular">
            trust {pct}%
            <span className="px-1.5 text-subtle">·</span>
            {tier}
          </span>
        </span>
      </div>

      {agent.capabilities.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {agent.capabilities.map(cap => (
            <span key={cap} className="font-mono text-[12px] text-muted">
              {cap}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-x-5 gap-y-1 flex-wrap text-[12.5px] text-muted">
        <span className="tabular">
          {agent.last_seen ? `Seen ${timeAgo(agent.last_seen)}` : 'Never seen'}
        </span>
        <span className="tabular">Registered {formatDate(agent.registered_at)}</span>
        <Link
          to={`/repos?owner=${encodeURIComponent(didKeySegment(agent.did))}`}
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Repositories <ArrowRight size={12} />
        </Link>
      </div>
    </li>
  );
}
