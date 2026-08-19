import type { ApiCert } from '../../lib/api';
import { shortDid, shortSha, timeAgo, formatDate } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';
import { Field, Seal } from '../register/primitives';
import { BorderBeam } from '../ui/border-beam';
import { GitBranch } from 'lucide-react';

/**
 * Ref-update certificates.
 *
 * This is the product's strongest evidence: each row is an Ed25519 signature
 * over a ref transition that a reader can check without trusting this node or
 * this page. So each carries the full transition, the pusher, and the command
 * that verifies it — rather than a line of grey metadata.
 */
export function CertList({ items }: { items: ApiCert[] }) {
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-3">
      {items.map((cert, i) => {
        const created = cert.old_sha.startsWith('0000000');
        return (
          <li
            key={cert.id}
            className="relative overflow-hidden px-4 py-3.5 border border-border rounded-[10px] bg-surface"
          >
            {/* The newest certificate is the live one; trace only that. */}
            {i === 0 && (
              <BorderBeam
                size={120}
                duration={9}
                borderWidth={1.5}
                colorFrom="var(--color-success)"
                colorTo="var(--color-foreground)"
              />
            )}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-foreground break-all">
                <GitBranch size={12} className="text-muted shrink-0" />
                {cert.ref_name}
              </span>
              <Seal label="signed" tone="success" title={`Issued ${formatDate(cert.issued_at)}`} />
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
              <Field label="Certificate">
                <span className="text-accent">{shortSha(cert.id)}</span>
              </Field>
              <Field label={created ? 'Created at' : 'Transition'}>
                {created ? (
                  <span className="text-accent">{shortSha(cert.new_sha)}</span>
                ) : (
                  <>
                    <span className="text-muted">{shortSha(cert.old_sha)}</span>
                    <span className="text-subtle px-1">&rarr;</span>
                    <span className="text-accent">{shortSha(cert.new_sha)}</span>
                  </>
                )}
              </Field>
              <Field label="Pusher">{shortDid(cert.pusher_did)}</Field>
              <Field label="Issued">{timeAgo(cert.issued_at)}</Field>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <code className="font-mono text-[12px] text-muted break-all bg-canvas-inset border border-separator rounded-[var(--radius-sm)] px-2 py-1">
                gl cert show &lt;repo&gt; {shortSha(cert.id)} --verify
              </code>
              <span className="flex items-center gap-2">
                <CopyButton value={cert.id} label="cert id" />
                <CopyButton value={cert.signature} label="signature" />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
