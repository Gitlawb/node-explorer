import type { ApiCert } from '../../lib/api';
import { shortDid, shortSha, timeAgo } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';

export function CertList({ items }: { items: ApiCert[] }) {
  return (
    <ul className="m-0 p-0 list-none border border-border">
      {items.map(cert => (
        <li
          key={cert.id}
          className="flex items-center gap-3 flex-wrap px-4 sm:px-6 py-3.5 border-b border-border-inner last:border-b-0"
        >
          <span className="text-[12px] tabular-nums text-warm-text">{shortSha(cert.id)}</span>
          <span className="text-[12.5px] text-foreground">{cert.ref_name}</span>
          <span className="text-[12px] tabular-nums">
            <span className="text-dim">{shortSha(cert.old_sha)}</span>
            <span className="text-muted-foreground"> → </span>
            <span className="text-warm-text">{shortSha(cert.new_sha)}</span>
          </span>
          <span className="text-[12px] text-muted-foreground">by {shortDid(cert.pusher_did)}</span>
          <span className="ml-auto flex items-center gap-3">
            <span className="text-[11px] tabular-nums text-dim whitespace-nowrap">{timeAgo(cert.issued_at)}</span>
            <CopyButton value={cert.signature} label="sig" />
          </span>
        </li>
      ))}
    </ul>
  );
}
