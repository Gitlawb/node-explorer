import type { ApiIssue } from '../../lib/api';
import { shortDid, timeAgo } from '../../lib/api';
import { Pill } from '../ui/Pill';

export function IssueList({ items }: { items: ApiIssue[] }) {
  return (
    <ul className="m-0 p-0 list-none border border-border">
      {items.map(issue => (
        <li key={issue.id} className="px-4 sm:px-6 py-4 border-b border-border-inner last:border-b-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Pill active={issue.status === 'open'}>{issue.status}</Pill>
            <span className="text-[14px] font-bold text-foreground break-words min-w-0">{issue.title}</span>
          </div>
          <p className="m-0 mt-1.5 text-[12px] text-dim">
            by <span className="text-muted-foreground">{shortDid(issue.author)}</span> · {timeAgo(issue.created_at)}
          </p>
          {issue.body && (
            <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">
              {issue.body}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
