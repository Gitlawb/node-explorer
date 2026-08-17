import type { ApiRepoEvent } from '../../lib/api';
import { shortDid, shortSha, timeAgo } from '../../lib/api';
import { Pill } from '../ui/Pill';

export function EventList({ items }: { items: ApiRepoEvent[] }) {
  return (
    <ul className="m-0 p-0 list-none border border-border">
      {items.map(event => (
        <li
          key={event.id}
          className="flex items-center gap-3 flex-wrap px-4 sm:px-6 py-3.5 border-b border-separator last:border-b-0"
        >
          <Pill>{event.type === 'local_cert' ? 'local cert' : event.type === 'gossipsub' ? 'gossip' : event.type}</Pill>
          <span className="text-[12.5px] text-foreground">{event.ref_name}</span>
          <span className="text-[12px] tabular-nums">
            <span className="text-muted">{shortSha(event.old_sha)}</span>
            <span className="text-muted"> → </span>
            <span className="text-accent">{shortSha(event.new_sha)}</span>
          </span>
          <span className="text-[12px] text-muted">by {shortDid(event.pusher_did)}</span>
          <span className="ml-auto text-[11px] tabular-nums text-muted whitespace-nowrap">
            {timeAgo(event.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
