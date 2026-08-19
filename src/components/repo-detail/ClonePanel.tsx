import { Button } from '../register/controls';
import { CopyButton } from '../ui/CopyButton';
import { Section } from '../register/primitives';
import { MagicCard } from '../ui/magic-card';
import { isHttpUrl } from '../../lib/api';

interface ClonePanelProps {
  /** The node's https clone URL — plain git handles this one. */
  cloneUrl: string;
  /** Canonical gitlawb:// remote, when the owner key and name are known. */
  gitlawbUrl?: string;
  onNavigate: (tab: string) => void;
}

/** Sidebar clone block. A section, not a card — it holds no list of rows. */
export function ClonePanel({ cloneUrl, gitlawbUrl, onNavigate }: ClonePanelProps) {
  const primary = gitlawbUrl ?? cloneUrl;
  const command = gitlawbUrl ? `git clone "${gitlawbUrl}"` : `git clone ${cloneUrl}`;

  return (
    <Section
      title="Clone"
      action={<CopyButton value={command} label="clone command" />}
    >
      {/* One card, in the sidebar only — a single pointer-tracked surface is
          affordable here in a way fifty list rows are not. */}
      <MagicCard
        gradientSize={160}
        gradientColor="var(--color-foreground)"
        gradientOpacity={0.1}
        gradientFrom="var(--color-foreground)"
        gradientTo="var(--color-muted)"
        className="rounded-[var(--radius)] border border-separator bg-canvas-inset"
      >
        <code className="block font-mono text-[12px] break-all leading-relaxed text-foreground px-2.5 py-2">
          git clone {gitlawbUrl ? `"${primary}"` : primary}
        </code>
      </MagicCard>

      {gitlawbUrl && isHttpUrl(cloneUrl) && (
        <p className="m-0 mt-2 text-[12px] leading-relaxed text-muted">
          The <code className="font-mono">gitlawb://</code> scheme requires the{' '}
          <code className="font-mono">git-remote-gitlawb</code> helper. Plain{' '}
          <code className="font-mono">git</code> can clone the same repository over{' '}
          <a href={cloneUrl} target="_blank" rel="noopener" className="text-accent hover:underline">
            https
          </a>
          .
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <Button fullWidth onPress={() => onNavigate('code')}>
          Browse code
        </Button>
        <Button fullWidth onPress={() => onNavigate('certs')}>
          Certificates
        </Button>
      </div>
    </Section>
  );
}
