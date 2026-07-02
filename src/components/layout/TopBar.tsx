import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Pill } from '../ui/Pill';
import { useNodeStatus } from '../../hooks/useNodeStatus';

export default function TopBar() {
  const { node, stats } = useNodeStatus();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border backdrop-blur-sm bg-background/95">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-4 px-4 sm:px-8 lg:px-12">

        {/* Left: branding */}
        <Link
          to="/repos"
          className="flex items-center gap-3 shrink-0 min-w-0
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
        >
          <span className="text-[13px] font-bold text-foreground whitespace-nowrap">
            gitlawb node explorer
          </span>
        </Link>
        {node?.network && <Pill className="max-sm:hidden">{node.network}</Pill>}

        <div className="flex-1" />

        {/* Right: live counts + theme */}
        <div className="flex items-center gap-4 shrink-0">
          {stats && (
            <span className="hidden md:inline text-[11px] tabular-nums text-muted-foreground">
              {stats.repos.toLocaleString()} repos · {stats.agents.toLocaleString()} agents
            </span>
          )}
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
}
