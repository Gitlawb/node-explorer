import type { ApiPull } from '../../lib/api';
import { shortDid, timeAgo } from '../../lib/api';
import { Pill } from '../ui/Pill';

export function PullList({ items }: { items: ApiPull[] }) {
  return (
    <ul className="m-0 p-0 list-none border border-border">
      {items.map(pull => (
        <li key={pull.id} className="px-4 sm:px-6 py-4 border-b border-border-inner last:border-b-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[12px] tabular-nums text-dim">#{pull.number}</span>
            <Pill active={pull.status === 'open'}>{pull.status}</Pill>
            <span className="text-[14px] font-bold text-foreground break-words min-w-0">{pull.title}</span>
          </div>
          <p className="m-0 mt-1.5 text-[12px] text-dim">
            <span className="text-warm-text">{pull.source_branch}</span>
            {' → '}
            <span className="text-muted-foreground">{pull.target_branch}</span>
            {' · by '}
            <span className="text-muted-foreground">{shortDid(pull.author_did)}</span>
            {' · '}
            {pull.merged_at ? `merged ${timeAgo(pull.merged_at)}` : timeAgo(pull.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
