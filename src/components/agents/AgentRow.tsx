import type { ApiAgent } from '../../lib/api';
import { shortDid, didKeySegment, trustTier, timeAgo, formatDate } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Pill } from '../ui/Pill';
import { CopyButton } from '../ui/CopyButton';

interface AgentRowProps {
  agent: ApiAgent;
  index: number;
}

export function AgentRow({ agent, index }: AgentRowProps) {
  const active = agent.status === 'active';

  return (
    <li
      className="grid grid-cols-[16px_minmax(0,1fr)] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_140px_110px]
        items-start gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3
        border-b border-border-inner last:border-b-0 hover:bg-hover transition-colors
        animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${index * 16}ms` }}
    >
      {/* Status dot */}
      <span
        aria-hidden="true"
        className={cn('pt-[3px] text-[8px] leading-none select-none', active ? 'text-ok' : 'text-status-dot')}
        title={agent.status}
      >
        ◆
      </span>

      {/* Identity + capabilities */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-bold text-foreground">{shortDid(agent.did)}</span>
          <span className="text-[11px] text-dim">{agent.status}</span>
          <CopyButton value={agent.did} label="did" />
          <Pill to={`/repos?owner=${encodeURIComponent(didKeySegment(agent.did))}`} data-row-link="">
            repos →
          </Pill>
        </div>
        {agent.capabilities.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {agent.capabilities.map(cap => (
              <span key={cap} className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground border border-border-inner rounded-[2px] px-1.5 py-0.5">
                {cap}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Trust */}
      <span className="hidden md:block pt-[2px] text-[12px] text-muted-foreground tabular-nums">
        {agent.trust_score.toFixed(2)} · {trustTier(agent.trust_score)}
      </span>

      {/* Last seen */}
      <span className="hidden md:block pt-[2px] text-[12px] text-dim tabular-nums">
        {agent.last_seen ? `seen ${timeAgo(agent.last_seen)}` : 'never seen'}
      </span>

      {/* Registered */}
      <span className="hidden md:block pt-[2px] text-[11px] text-dim tabular-nums text-right whitespace-nowrap">
        {formatDate(agent.registered_at)}
      </span>
    </li>
  );
}
