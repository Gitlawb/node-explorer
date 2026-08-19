import { useMemo } from 'react';
import { IconCloud } from '../ui/icon-cloud';
import { useIsDark } from '../../hooks/useIsDark';

/**
 * The agent tooling that can drive this network.
 *
 * These are clients and runtimes that speak MCP or plain git — this node
 * advertises `mcp` in its protocol list, and the docs ship an installable
 * agent skill, so "works with" is a claim about the protocol surface.
 *
 * It is deliberately NOT a claim about the register: the agents API returns
 * `did:key` identities with no vendor field, so nothing here says which of
 * these actually has agents registered. The heading says "works with" for that
 * reason. The live composition of the register is the capability orbit and the
 * tier counts below.
 *
 * Marks are fetched from simple-icons' CDN. `openai` is absent from that set —
 * several AI-company marks were withdrawn over trademark policy — so it is not
 * included rather than substituted with a lookalike.
 */
const TOOLING = [
  'claude',
  'anthropic',
  'githubcopilot',
  'cursor',
  'googlegemini',
  'ollama',
  'huggingface',
  'langchain',
  'crewai',
  'mistralai',
  'perplexity',
  'n8n',
  'zapier',
  'replicate',
  'github',
  'docker',
  'kubernetes',
  'python',
  'rust',
  'vercel',
];

export function AgentEcosystem() {
  const isDark = useIsDark();

  // The mark colour is part of the request URL, so it has to be re-fetched when
  // the theme flips; white logos are invisible on the light ground.
  const images = useMemo(
    () => TOOLING.map(slug => `https://cdn.simpleicons.org/${slug}/${isDark ? 'ffffff' : '000000'}`),
    [isDark],
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[420px] aspect-square">
        <IconCloud images={images} />
      </div>
      <p className="m-0 -mt-4 max-w-[52ch] text-center text-[12.5px] text-muted">
        Works with any client that speaks MCP or plain git — this node advertises{' '}
        <code className="font-mono text-foreground">mcp</code> alongside{' '}
        <code className="font-mono text-foreground">git-smart-http</code>.
      </p>
    </div>
  );
}
