import { cn } from '../../lib/utils';
import type { ReplicationStatus, Presence } from '../../lib/replication';
import { parseEventRepo, shortRefName, shortSha, timeAgo } from '../../lib/api';
import { MicroLabel } from '../ui/MicroLabel';

const PRESENCE_GLYPH: Record<Presence, { glyph: string; cls: string; title: string }> = {
  origin: { glyph: '◆', cls: 'text-accent', title: 'origin — received the push' },
  replicated: { glyph: '◆', cls: 'text-success', title: 'replicated via gossip' },
  missing: { glyph: '◇', cls: 'text-muted', title: 'not yet replicated' },
};

interface ReplicationTableProps {
  replication: ReplicationStatus;
  /** Node labels in display order (columns). */
  labels: string[];
  rowLimit?: number;
}

export function ReplicationTable({ replication, labels, rowLimit = 12 }: ReplicationTableProps) {
  const rows = replication.rows.slice(0, rowLimit);
  const short = (label: string) => label.split('.')[0];

  return (
    <div className="border border-border">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-10 border-b border-border bg-surface">
        <MicroLabel>replication — latest ref updates across nodes</MicroLabel>
        <span className="text-[11px] tabular-nums text-muted">
          {replication.fullyReplicatedCount}/{replication.totalTuples} in sync ·{' '}
          <span className={replication.coveragePercent >= 90 ? 'text-success' : 'text-accent'}>
            {replication.coveragePercent}%
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header */}
          <div
            className="grid gap-x-4 px-4 sm:px-6 h-10 items-center border-b border-border bg-surface"
            style={{ gridTemplateColumns: `minmax(0,1fr) 90px 70px repeat(${labels.length}, 88px)` }}
          >
            <MicroLabel>repo · ref</MicroLabel>
            <MicroLabel>commit</MicroLabel>
            <MicroLabel>when</MicroLabel>
            {labels.map(l => (
              <MicroLabel key={l} className="text-center">{short(l)}</MicroLabel>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="m-0 py-12 text-center text-[13px] text-muted">
              no ref updates observed on any node yet
            </p>
          ) : (
            <ul className="m-0 p-0 list-none">
              {rows.map(row => {
                const repoRef = parseEventRepo(row.tuple.repo);
                return (
                  <li
                    key={row.tuple.key}
                    className="grid gap-x-4 px-4 sm:px-6 py-2.5 items-baseline border-b border-separator last:border-b-0 hover:bg-surface-secondary transition-colors"
                    style={{ gridTemplateColumns: `minmax(0,1fr) 90px 70px repeat(${labels.length}, 88px)` }}
                  >
                    <span className="min-w-0 truncate text-[12px]">
                      <span className="font-bold text-foreground">
                        {repoRef ? repoRef.label : row.tuple.repo}
                      </span>
                      <span className="text-muted"> · {shortRefName(row.tuple.ref_name)}</span>
                    </span>
                    <span className="text-[11px] text-muted tabular-nums">
                      {shortSha(row.tuple.new_sha)}
                    </span>
                    <span className="text-[11px] text-muted tabular-nums whitespace-nowrap">
                      {timeAgo(row.tuple.timestamp)}
                    </span>
                    {labels.map(label => {
                      const presence = row.presence[label] ?? 'missing';
                      const { glyph, cls, title } = PRESENCE_GLYPH[presence];
                      return (
                        <span
                          key={label}
                          className={cn('text-center text-[10px] select-none', cls)}
                          title={`${label}: ${title}`}
                        >
                          {glyph}
                        </span>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Legend + drift */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-6 py-3 border-t border-border text-[10px] text-muted">
        <span><span aria-hidden="true" className="text-accent">◆</span> origin</span>
        <span><span aria-hidden="true" className="text-success">◆</span> replicated</span>
        <span><span aria-hidden="true">◇</span> missing</span>
        <span className="flex-1" />
        {labels.map(l => (
          <span key={l} className="tabular-nums">
            {short(l)}: {replication.driftByNode[l] ?? 0} behind
          </span>
        ))}
      </div>
    </div>
  );
}
