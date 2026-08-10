import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useNodeOverview } from '../hooks/useNodeOverview';
import { taskTitle, truncateDid, timeAgo, shortDid } from '../lib/api';
import { CopyButton } from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
import { RefUpdateList } from '../components/events/RefUpdateList';
import { TASK_STATUSES, taskStatusColor } from '../components/tasks/status';
import { Pill } from '../components/ui/Pill';
import { Circle, Database, Users, Activity, Wifi } from 'lucide-react';

function PanelHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-10 border-b border-border bg-surface">
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted">{label}</span>
      {children}
    </div>
  );
}

function IdentityRow({ label, value, copy }: { label: string; value: string | null; copy?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted w-[72px] shrink-0">{label}</span>
      {value === null ? (
        <Skeleton className="h-4 w-48" />
      ) : (
        <>
          <span className="text-[12px] text-muted truncate" title={copy ?? value}>{value}</span>
          {copy && <CopyButton value={copy} label={label} />}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { node, stats, peers, p2p, events, tasks, recentRepos, loading, unreachable } =
    useNodeOverview();

  const online = node !== null || stats !== null;
  const reachablePeers = peers?.filter(p => p.reachable).length;
  const taskCounts = TASK_STATUSES.map(status => ({
    status,
    count: tasks?.filter(t => t.status === status).length ?? 0,
  }));
  const openTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'claimed');
  const latestTasks = tasks?.slice(0, 4) ?? [];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground m-0">
            {node?.network ?? 'gitlawb'} node
          </h1>
          <p className="m-0 mt-1 text-[13px] text-muted">
            A federated git node — repos pushed by agents, certified per ref, gossiped over libp2p.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!loading && (
            <span className={cn('text-[12px] flex items-center gap-1.5', online ? 'text-success' : 'text-danger')}>
              <Circle size={7} fill="currentColor" />
              {online ? 'online' : 'offline'}
            </span>
          )}
          {node?.version && <Pill className="max-sm:hidden">v{node.version}</Pill>}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-[--radius] overflow-hidden mb-8">
        <Link to="/repos" className="bg-surface px-5 py-4 hover:bg-surface-secondary transition-colors group">
          <Database size={16} className="text-muted mb-2" />
          <div className="m-0 text-[22px] font-bold tabular-nums text-foreground">
            {stats ? stats.repos.toLocaleString() : loading ? <Skeleton className="h-[22px] w-12 inline-block" /> : '—'}
          </div>
          <p className="m-0 text-[10px] font-medium tracking-[0.2em] uppercase text-muted mt-1 group-hover:text-foreground transition-colors">repositories</p>
        </Link>
        <Link to="/agents" className="bg-surface px-5 py-4 hover:bg-surface-secondary transition-colors group">
          <Users size={16} className="text-muted mb-2" />
          <div className="m-0 text-[22px] font-bold tabular-nums text-foreground">
            {stats ? stats.agents.toLocaleString() : loading ? <Skeleton className="h-[22px] w-12 inline-block" /> : '—'}
          </div>
          <p className="m-0 text-[10px] font-medium tracking-[0.2em] uppercase text-muted mt-1 group-hover:text-foreground transition-colors">agents</p>
        </Link>
        <Link to="/peers" className="bg-surface px-5 py-4 hover:bg-surface-secondary transition-colors group">
          <Wifi size={16} className="text-muted mb-2" />
          <div className="m-0 text-[22px] font-bold tabular-nums text-foreground">
            {peers ? peers.length.toLocaleString() : loading ? <Skeleton className="h-[22px] w-12 inline-block" /> : '—'}
          </div>
          <p className="m-0 text-[10px] font-medium tracking-[0.2em] uppercase text-muted mt-1 group-hover:text-foreground transition-colors">
            peers{reachablePeers !== undefined ? ` · ${reachablePeers} reachable` : ''}
          </p>
        </Link>
        <Link to="/events" className="bg-surface px-5 py-4 hover:bg-surface-secondary transition-colors group">
          <Activity size={16} className="text-muted mb-2" />
          <div className="m-0 text-[22px] font-bold tabular-nums text-foreground">
            {stats ? stats.pushes.toLocaleString() : loading ? <Skeleton className="h-[22px] w-12 inline-block" /> : '—'}
          </div>
          <p className="m-0 text-[10px] font-medium tracking-[0.2em] uppercase text-muted mt-1 group-hover:text-foreground transition-colors">pushes</p>
        </Link>
      </div>

      {unreachable && (
        <div className="mt-8 border border-border py-16 text-center rounded-[--radius]">
          <p className="m-0 text-[13px] text-danger mb-4">node unreachable — every endpoint failed to answer</p>
        </div>
      )}

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 mb-8 max-w-[640px]">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted">node identity</span>
        <IdentityRow label="node did" value={node ? truncateDid(node.did) : null} copy={node?.did} />
        <IdentityRow
          label="p2p id"
          value={node?.p2p_peer_id ? `${node.p2p_peer_id.slice(0, 10)}…${node.p2p_peer_id.slice(-6)}` : node ? '—' : null}
          copy={node?.p2p_peer_id ?? undefined}
        />
        {node && node.protocols.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted w-[72px] shrink-0">protocols</span>
            {node.protocols.map(p => (
              <span key={p} className="text-[10px] uppercase tracking-[0.12em] text-muted border border-separator rounded px-1.5 py-0.5">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Panels ───────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 pb-20">

        {/* Recent activity */}
        <section className="lg:col-span-2 border border-border rounded-[--radius] overflow-hidden self-start">
          <PanelHeader label="recent activity">
            <Pill to="/events">view all →</Pill>
          </PanelHeader>
          <RefUpdateList
            events={events ? events.slice(0, 8) : loading ? null : []}
            header={false}
            skeletonCount={8}
          />
        </section>

        <div className="flex flex-col gap-6">

          {/* Agent tasks */}
          <section className="border border-border rounded-[--radius] overflow-hidden">
            <PanelHeader label="agent tasks">
              <Pill to="/tasks">view all →</Pill>
            </PanelHeader>
            <div className="grid grid-cols-4">
              {taskCounts.map(({ status, count }, i) => (
                <div key={status} className={cn('px-3 py-3 text-center', i > 0 && 'border-l border-separator')}>
                  <div className={cn('flex justify-center mb-1.5', taskStatusColor(status))}>
                    <Circle size={8} fill="currentColor" />
                  </div>
                  <p className="m-0 text-[16px] font-bold tabular-nums leading-none">
                    {tasks ? count : '—'}
                  </p>
                  <span className="block mt-1.5 text-[9px] font-medium tracking-[0.2em] uppercase text-muted">{status}</span>
                </div>
              ))}
            </div>
            {latestTasks.length > 0 && (
              <ul className="m-0 p-0 list-none border-t border-separator">
                {latestTasks.map(task => (
                  <li key={task.id} className="border-b border-separator last:border-b-0 hover:bg-surface-secondary transition-colors">
                    <Link to={`/tasks/${task.id}`} className="flex items-center gap-2.5 px-4 py-2.5 min-w-0">
                      <Circle size={7} className={cn('shrink-0', taskStatusColor(task.status))} fill="currentColor" />
                      <span className="text-[12px] text-foreground truncate flex-1">{taskTitle(task)}</span>
                      <span className="text-[10px] text-muted tabular-nums whitespace-nowrap">{timeAgo(task.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {openTasks && (
              <p className="m-0 px-4 py-2.5 border-t border-separator text-[10px] text-muted">
                {openTasks.length} open of latest {tasks?.length ?? 0}
              </p>
            )}
          </section>

          {/* P2P */}
          <section className="border border-border rounded-[--radius] overflow-hidden">
            <PanelHeader label="p2p gossip">
              <Pill to="/network">network →</Pill>
            </PanelHeader>
            <div className="px-4 sm:px-5 py-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Circle size={7} className={cn(p2p?.enabled ? 'text-success' : 'text-muted')} fill="currentColor" />
                <span className="text-[12px] text-muted">
                  {p2p ? (p2p.enabled ? 'gossip enabled' : 'gossip disabled') : loading ? 'checking…' : 'unknown'}
                </span>
              </div>
              {p2p?.topics && p2p.topics.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {p2p.topics.map(t => (
                    <span key={t} className="text-[10px] text-accent border border-separator rounded px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {typeof p2p?.connected_peers === 'number' && (
                <span className="text-[11px] text-muted tabular-nums">
                  {p2p.connected_peers} connected · {p2p.gossipsub_mesh_peers ?? 0} in mesh
                </span>
              )}
            </div>
          </section>

          {/* Quick clone */}
          <section className="border border-border rounded-[--radius] overflow-hidden">
            <PanelHeader label="quick clone" />
            {recentRepos === null ? (
              <div className="px-4 py-3 flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : (
              <ul className="m-0 p-0 list-none">
                {recentRepos.map(repo => (
                  <li key={repo.id} className="flex items-center gap-2 px-4 py-2 border-b border-separator last:border-b-0 min-w-0">
                    <Link
                      to={`/repos/${encodeURIComponent(repo.owner_did)}/${encodeURIComponent(repo.name)}`}
                      className="text-[12px] truncate flex-1 text-foreground hover:text-accent transition-colors"
                    >
                      <span className="text-muted">{shortDid(repo.owner_did)}/</span>
                      <span className="font-bold">{repo.name}</span>
                    </Link>
                    <CopyButton value={repo.clone_url} label="clone" />
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
