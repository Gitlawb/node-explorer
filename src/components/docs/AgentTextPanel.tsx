import { useState } from 'react';

/**
 * The machine-readable copies of this page.
 *
 * This is the part of the docs that is actually load-bearing for the product:
 * an agent fetches `/docs/<slug>.md` and gets the same words a person reads,
 * as plain markdown. It used to be a `hidden lg:block` list in the sidebar, so
 * the one thing that distinguishes these docs was invisible on any screen
 * narrower than a laptop. It is now stated on the page at every width.
 */
interface AgentTextPanelProps {
  slug: string;
}

export function AgentTextPanel({ slug }: AgentTextPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, path: string) => {
    const url = new URL(path, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard access is permission-gated; leave the link, which works.
    }
  };

  const files = [
    { label: `${slug}.md`, path: `/docs/${slug}.md`, note: 'this page as markdown' },
    { label: 'skill.md', path: '/skill.md', note: 'installable agent skill' },
    { label: 'llms.txt', path: '/llms.txt', note: 'index for language models' },
  ];

  return (
    <section
      aria-labelledby="agent-text-heading"
      className="rounded-[var(--radius)] border border-border bg-surface-secondary p-4"
    >
      <h2 id="agent-text-heading" className="m-0 text-[13px] font-semibold text-foreground">
        Read this as text
      </h2>
      <p className="m-0 mt-1 text-[12px] text-muted">
        Every page here is served as plain markdown to any client that asks for it.
      </p>

      <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
        {files.map(file => (
          <li key={file.label} className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <a
                href={file.path}
                className="min-w-0 truncate font-mono text-[12.5px] text-foreground hover:text-accent hover:underline"
              >
                {file.label}
              </a>
              <button
                type="button"
                onClick={() => copy(file.label, file.path)}
                aria-label={`Copy URL for ${file.label}`}
                className="shrink-0 rounded-[var(--radius-control)] px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:bg-surface hover:text-foreground focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
              >
                {copied === file.label ? 'Copied' : 'Copy'}
              </button>
            </div>
            <span className="text-[11px] leading-snug text-muted">{file.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
