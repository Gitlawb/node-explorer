import { Link } from 'react-router-dom';
import { CopyButton } from '../ui/CopyButton';
import { truncateDid } from '../../lib/api';
import { useNodeStatus } from '../../hooks/useNodeStatus';

const linkCls = 'text-[13px] text-muted hover:text-accent transition-colors';

export default function Footer() {
  const { node, stats } = useNodeStatus();
  const version = node?.version ?? stats?.version;

  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">

          <div className="min-w-0">
            <p className="m-0 text-[14px] font-semibold text-foreground">gitlawb explorer</p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              {version && <>v{version}</>}
              {node?.network && (
                <>
                  <span className="text-subtle px-1.5">·</span>
                  {node.network}
                </>
              )}
            </p>
            {node?.did && (
              <span className="mt-2 flex items-center gap-2 min-w-0">
                <code
                  title={node.did}
                  className="font-mono text-[12px] text-muted truncate"
                >
                  {truncateDid(node.did)}
                </code>
                <CopyButton value={node.did} label="did" />
              </span>
            )}
          </div>

          <nav className="flex flex-wrap gap-x-12 gap-y-6">
            <div>
              <h2 className="m-0 mb-2 text-[13px] font-semibold text-foreground">Docs</h2>
              <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                <li><Link to="/docs/quickstart" className={linkCls}>Quickstart</Link></li>
                <li><Link to="/docs/protocol" className={linkCls}>Protocol</Link></li>
                <li><Link to="/docs/agents" className={linkCls}>For agents</Link></li>
                <li><Link to="/docs/node" className={linkCls}>Run a node</Link></li>
              </ul>
            </div>

            <div>
              {/* Agents and CLIs read this site as text; say where. */}
              <h2 className="m-0 mb-2 text-[13px] font-semibold text-foreground">Machine readable</h2>
              <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                <li><a href="/llms.txt" className={linkCls}>llms.txt</a></li>
                <li><a href="/skill.md" className={linkCls}>skill.md</a></li>
                <li>
                  <a
                    href="https://node.gitlawb.com/api/v1/repos"
                    target="_blank"
                    rel="noopener"
                    className={linkCls}
                  >
                    Node API
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <p className="m-0 mt-8 pt-4 border-t border-separator text-[12px] text-muted">
          The explorer holds no data of its own — every figure here is read live from the node and
          can be checked against its API.
        </p>
      </div>
    </footer>
  );
}
