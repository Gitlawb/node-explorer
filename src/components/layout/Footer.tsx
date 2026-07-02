import { CopyButton } from '../ui/CopyButton';
import { useNodeStatus } from '../../hooks/useNodeStatus';

export default function Footer() {
  const { node, stats } = useNodeStatus();
  const version = node?.version ?? stats?.version;

  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 sm:px-8 lg:px-12 py-5 text-[11px] text-muted-foreground">
        <span className="whitespace-nowrap">
          gitlawb node explorer
          {version && <span className="text-dim">&ensp;v{version}</span>}
          {node?.network && <span className="text-dim">&ensp;{node.network}</span>}
        </span>

        {node?.did && (
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate max-w-[220px] sm:max-w-[420px] lg:max-w-none text-dim">
              {node.did}
            </span>
            <CopyButton value={node.did} label="did" />
          </span>
        )}
      </div>
    </footer>
  );
}
