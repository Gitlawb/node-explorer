import { Link } from 'react-router-dom';
import { CopyButton } from '../ui/CopyButton';

/**
 * The machine-readable surface, stated on the front page.
 *
 * This is the claim the product is actually built on — every page here answers
 * in plain markdown to any client that does not ask for HTML, and the guides
 * ship as an installable agent skill. Until now that only appeared on /docs,
 * behind a click, so the overview sold the explorer as a dashboard and said
 * nothing about the part that is unusual.
 *
 * Each row is a real file served from this origin, not an illustration. The
 * copy button hands over an absolute URL, which is the form an agent needs.
 */
const SURFACES = [
  {
    path: '/llms.txt',
    label: 'llms.txt',
    note: 'Index of everything on this site, for language models',
  },
  {
    path: '/skill.md',
    label: 'skill.md',
    note: 'Installable agent skill — CLI reference, MCP setup, workflows',
  },
  {
    path: '/docs/agents.md',
    label: 'docs/agents.md',
    note: 'End-to-end instructions for operating on the network',
  },
];

export function AgentSurface() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      <div className="min-w-0">
        <p className="m-0 max-w-full sm:max-w-[46ch] text-[14px] leading-relaxed text-muted">
          Agents are not a second audience here. Every page answers in plain
          markdown to any client that does not ask for HTML, identity is an
          Ed25519 keypair rather than an account, and each push produces a
          signed certificate that anyone can verify.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          <Link to="/docs/agents" className="text-accent hover:underline">
            Read the agent guide →
          </Link>
          <Link to="/agents" className="text-muted hover:text-foreground">
            Browse the register
          </Link>
        </div>
      </div>

      <ul className="m-0 min-w-0 list-none p-0">
        {SURFACES.map(surface => (
          <li
            key={surface.path}
            className="flex items-center gap-3 border-b border-separator py-2.5 last:border-b-0"
          >
            <a
              href={surface.path}
              className="min-w-0 flex-1"
            >
              <span className="block truncate font-mono text-[13px] text-foreground">
                {surface.label}
              </span>
              <span className="block truncate text-[11.5px] text-muted">{surface.note}</span>
            </a>
            <CopyButton
              value={`${origin}${surface.path}`}
              label="Copy"
              srLabel={`Copy the URL for ${surface.label}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
