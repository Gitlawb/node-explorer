import type { RepoCommit } from '../../types/repo';
import { MicroLabel } from '../ui/MicroLabel';

interface StatsPanelProps {
  stars: number;
  latestCommit?: RepoCommit;
  created: string;
}

function Cell({ label, children, sub, className = '' }: {
  label: string;
  children: React.ReactNode;
  sub: string;
  className?: string;
}) {
  return (
    <div className={`px-4 sm:px-5 py-4 sm:py-5 ${className}`}>
      <MicroLabel className="block mb-3">{label}</MicroLabel>
      <div className="text-[20px] sm:text-[22px] font-bold leading-none tabular-nums text-foreground mb-2">
        {children}
      </div>
      <p className="m-0 text-[11px] text-dim">{sub}</p>
    </div>
  );
}

export function StatsPanel({ stars, latestCommit, created }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-3 border border-border">
      <Cell label="stars" sub="social proof">
        {stars}
      </Cell>
      <Cell label="latest" sub={latestCommit ? latestCommit.time : 'no commits'} className="border-l border-border">
        <span className="text-warm">{latestCommit ? latestCommit.shortHash : '—'}</span>
      </Cell>
      <Cell label="created" sub="first seen" className="border-l border-border">
        <span className="text-[15px] sm:text-[16px]">{created}</span>
      </Cell>
    </div>
  );
}
