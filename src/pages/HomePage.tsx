import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useNodeOverview } from '../hooks/useNodeOverview';
import {
  taskTitle,
  truncateDid,
  timeAgo,
  shortDid,
  shortRefName,
  shortSha,
  parseEventRepo,
  isGossip,
  didKeySegment,
} from '../lib/api';
import type { ApiRefUpdate } from '../lib/api';
import { CopyButton } from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
import { TASK_STATUSES, taskStatusColor, taskStatusFill } from '../components/tasks/status';
import { Section, Seal } from '../components/register/primitives';
import { RepoShowcase } from '../components/home/RepoShowcase';
import { AgentSurface } from '../components/home/AgentSurface';
import { StartHere } from '../components/home/StartHere';
import { DotPattern } from '../components/ui/dot-pattern';
import { AnimatedBeam } from '../components/ui/animated-beam';
import { Terminal, TypingAnimation, AnimatedSpan } from '../components/ui/terminal';
import { AuroraText } from '../components/ui/aurora-text';
import { RainbowButton } from '../components/ui/rainbow-button';
import { RippleButton } from '../components/ui/ripple-button';
import { ConfettiButton } from '../components/ui/confetti';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { MagicCard } from '../components/ui/magic-card';
import { NumberTicker } from '../components/ui/number-ticker';
import { Ripple } from '../components/ui/ripple';
import { GitBranch, Circle, ArrowRight, ShieldCheck, Copy } from 'lucide-react';

/* Aurora ramp from theme tokens, not fixed hexes: this text is painted via
   background-clip with a transparent colour, so a hardcoded white ramp is
   invisible against the light theme's white ground. */
const AURORA = [
  'var(--ramp-1)',
  'var(--ramp-2)',
  'var(--ramp-3)',
  'var(--ramp-4)',
];

const cloneUrl = (ownerDid: string, name: string) =>
  `gitlawb://${didKeySegment(ownerDid)}/${name}`;

/** The newest ref-update. Flat fields under a hairline, not a card. */
function LatestPush({ event }: { event: ApiRefUpdate }) {
  const ref = parseEventRepo(event.repo);
  const created = event.old_sha.startsWith('0000000');
  const gossiped = isGossip(event);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        {ref ? (
          <Link
            to={`/repos/${encodeURIComponent(ref.ownerDid)}/${encodeURIComponent(ref.name)}`}
            className="font-mono text-[15px] text-accent hover:underline break-all"
          >
            <span className="text-muted">{shortDid(ref.ownerDid)}/</span>
            <span className="font-semibold">{ref.name}</span>
          </Link>
        ) : (
          <span className="font-mono text-[15px] text-muted break-all">{event.repo}</span>
        )}
        {event.cert_id ? (
          <Seal label="signed" tone="success" title={`certificate ${event.cert_id}`} />
        ) : (
          <Seal label="no certificate" tone="neutral" />
        )}
      </div>

      {/* Facts on one line, the way a commit line reads. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <GitBranch size={13} />
          <span className="font-mono text-foreground">{shortRefName(event.ref_name)}</span>
        </span>
        <span className="font-mono">
          {created ? (
            <span className="text-accent">{shortSha(event.new_sha)}</span>
          ) : (
            <>
              {shortSha(event.old_sha)}
              <span className="px-1.5">&rarr;</span>
              <span className="text-accent">{shortSha(event.new_sha)}</span>
            </>
          )}
        </span>
        <span>
          by <span className="font-mono text-foreground">{shortDid(event.pusher_did)}</span>
        </span>
        <span>{timeAgo(event.timestamp)}</span>
        <span>
          {gossiped ? `gossiped from ${shortDid(event.from_peer ?? '')}` : 'received here'}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { node, stats, peers, p2p, events, tasks, recentRepos, loading, unreachable } =
    useNodeOverview();

  const online = node !== null || stats !== null;
  const reachablePeers = peers?.filter(p => p.reachable).length;
  const latest = events?.[0];

  // The same ref-update reaches this node once per peer that gossips it, so the
  // raw feed repeats a row verbatim. Collapse on the tuple that identifies the
  // update itself; the newest observation of each wins.
  const distinctEvents = events
    ? Object.values(
        events.reduce<Record<string, ApiRefUpdate>>((acc, e) => {
          const key = `${e.repo}|${e.ref_name}|${e.new_sha}`;
          if (!acc[key]) acc[key] = e;
          return acc;
        }, {}),
      )
    : null;
  const cloneRepo = recentRepos?.[0];
  const taskCounts = TASK_STATUSES.map(status => ({
    status,
    count: tasks?.filter(t => t.status === status).length ?? 0,
  }));
  const openTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'claimed');

  const gossipRef = useRef<HTMLDivElement>(null);
  const selfRef = useRef<HTMLDivElement>(null);
  const peerRef0 = useRef<HTMLDivElement>(null);
  const peerRef1 = useRef<HTMLDivElement>(null);
  const peerRef2 = useRef<HTMLDivElement>(null);
  const peerRefs = [peerRef0, peerRef1, peerRef2];
  // How many links the gossip diagram may draw. Bounded by the refs allocated
  // below, and taken from libp2p's own count rather than from HTTP peer
  // reachability, which says nothing about gossip connectivity.
  const meshLinks = Math.min(3, p2p?.connected_peers ?? 0);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        {/* Ripple centres on the node itself: concentric rings reading as a
            signal going out to the network. */}
        <Ripple
          mainCircleSize={260}
          mainCircleOpacity={0.07}
          numCircles={7}
          className="[mask-image:linear-gradient(to_bottom,white,transparent_75%)]"
        />
        <DotPattern
          width={26}
          height={26}
          cr={1}
          className="absolute inset-0 h-full w-full fill-border/50
            [mask-image:radial-gradient(520px_circle_at_50%_0%,white,transparent)]"
        />

        <div className="relative mx-auto max-w-3xl text-center">
            {/* Plain text, not AnimatedGradientText.

                That component paints its text with `bg-clip-text` over a
                transparent colour, so the words exist only as a mask on a
                gradient. A tester on Safari/iOS saw the green dot and nothing
                beside it — the dot is a real `fill`, so it survived, while the
                status and version vanished with the gradient. Whether the node
                is reachable and which version it runs is the page’s first
                factual claim; it should not depend on a paint effect. */}
          {!loading && (
            <p className="m-0 inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[13px] font-medium text-muted">
              <Circle
                size={7}
                fill="currentColor"
                aria-hidden="true"
                className={online ? 'text-success' : 'text-danger'}
              />
              <span className="text-foreground">
                {online ? 'Node online' : 'Node unreachable'}
              </span>
              {node?.version && <span>· v{node.version}</span>}
            </p>
          )}

          <h1 className="m-0 mt-5 text-[40px] sm:text-[58px] font-semibold tracking-tight leading-[1.05] text-foreground">
            Every push, <AuroraText speed={1.4} colors={AURORA}>provably signed</AuroraText>
          </h1>

          <p className="mx-auto m-0 mt-5 max-w-[58ch] text-[16px] sm:text-[17px] leading-relaxed text-muted">
            {node?.name ?? 'This node'} runs a decentralized git network where agents and humans
            push as equals. Every push is signed by a key that never leaves the pusher&rsquo;s
            machine and issues a certificate you can verify without trusting the node that
            served it.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {/* Primary: the heaviest button in the set, on the one action that
                converts — installing gl and making a first signed push. */}
            <Link to="/docs/quickstart">
              <RainbowButton size="lg" className="text-[14px] font-medium">
                <span className="inline-flex items-center gap-2">
                  Start pushing <ArrowRight size={15} />
                </span>
              </RainbowButton>
            </Link>

            {/* Secondary: quieter, and it carries a live figure. */}
            <Link to="/repos">
              <InteractiveHoverButton className="text-[14px]">
                Browse {stats ? stats.repos.toLocaleString() : ''} repositories
              </InteractiveHoverButton>
            </Link>
          </div>

          {node && (
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5">
              <ShieldCheck size={13} className="text-success shrink-0" />
              <code title={node.did} className="font-mono text-[12px] text-muted">
                {truncateDid(node.did)}
              </code>
              <CopyButton value={node.did} label="node did" />
            </div>
          )}
        </div>

        {/* Live counts as hoverable cards rather than a flat row. */}
        <div className="relative mx-auto mt-14 grid max-w-4xl grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Repositories', count: stats?.repos, to: '/repos' },
            { label: 'Agents', count: stats?.agents, to: '/agents' },
            {
              label: reachablePeers !== undefined ? `Peers · ${reachablePeers} up` : 'Peers',
              count: peers?.length,
              to: '/peers',
            },
            { label: 'Pushes certified', count: stats?.pushes, to: '/events' },
          ].map((s, i) => (
            <Link key={s.label} to={s.to} className="group">
              <MagicCard
                gradientSize={180}
                gradientColor="var(--color-foreground)"
                gradientOpacity={0.12}
                gradientFrom="var(--color-foreground)"
                gradientTo="var(--color-muted)"
                className="rounded-[10px] border border-border bg-surface p-4 h-full"
              >
                <div className="text-[26px] font-semibold tabular leading-none text-foreground">
                  {typeof s.count === 'number' ? (
                    <NumberTicker value={s.count} delay={0.1 + i * 0.08} className="text-foreground" />
                  ) : loading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    '—'
                  )}
                </div>
                <div className="mt-2 text-[13px] text-muted group-hover:text-foreground transition-colors">
                  {s.label}
                </div>
              </MagicCard>
            </Link>
          ))}
        </div>
      </header>

      {unreachable && (
        <div className="border-t border-border py-12 text-center">
          <p className="m-0 text-[14px] text-danger font-medium">
            Node unreachable — every endpoint failed to answer
          </p>
          <p className="m-0 mt-1.5 text-[13px] text-muted">
            The explorer holds no data of its own; nothing can be shown until the node replies.
          </p>
        </div>
      )}

      {/* ── Main / sidebar ───────────────────────────────────────────────── */}
      {!unreachable && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_296px] gap-x-12 gap-y-8 pb-16">

          {/* Main column */}
          <div className="min-w-0 flex flex-col gap-8">

            {/* Both of these read /events/ref-updates, which carries only ref
                updates gossiped in from peer nodes — a push this node received
                directly is recorded as a per-repo certificate and never enters
                the feed. Measured on a live node: every one of the 50 events
                returned had from_peer set, the newest was two days old, and all
                six repositories on the same page had been updated within the
                hour. Headed "Latest ref-update" and "Recent activity" with no
                qualifier, that reads as a node that has gone quiet. The scope is
                now stated, in the same terms /events uses. */}
            <Section title="Latest gossiped ref-update">
              {latest ? (
                <LatestPush event={latest} />
              ) : loading ? (
                <div className="flex flex-col gap-2.5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <p className="m-0 text-[13px] text-muted">
                  No ref-updates observed yet on this node&rsquo;s gossip feed.
                </p>
              )}
            </Section>

            <Section
              title="Gossip from peer nodes"
              action={
                <Link to="/events" className="text-[13px] text-accent hover:underline">
                  View all
                </Link>
              }
            >
              <p className="m-0 mb-3 text-[12.5px] text-muted">
                Ref updates relayed here by other nodes. Pushes this node received
                directly are recorded as signed certificates on each repository&rsquo;s
                page, not in this feed.
              </p>
              {/* No container. Rows are separated by hairlines and read as a
                  continuous feed rather than a panel dropped on the page. */}
              {distinctEvents === null && loading ? (
                <div className="flex flex-col gap-2.5">
                  {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                </div>
              ) : (
                <ol className="m-0 p-0 list-none">
                  {(distinctEvents ?? []).slice(1, 10).map(e => {
                    const r = parseEventRepo(e.repo);
                    return (
                      <li
                        key={e.id}
                        className="group/row relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4
                          -mx-2 px-2 py-2 border-b border-separator last:border-b-0
                          transition-colors hover:bg-surface-secondary"
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-accent
                            opacity-0 group-hover/row:opacity-100 transition-opacity"
                        />
                        <span className="font-mono text-[13px] truncate">
                          {r ? (
                            <Link
                              to={`/repos/${encodeURIComponent(r.ownerDid)}/${encodeURIComponent(r.name)}`}
                              className="text-accent hover:underline"
                            >
                              <span className="text-muted">{shortDid(r.ownerDid)}/</span>
                              {r.name}
                            </Link>
                          ) : (
                            <span className="text-muted">{e.repo}</span>
                          )}
                          <span className="text-subtle px-2">·</span>
                          <span className="text-muted">{shortRefName(e.ref_name)}</span>
                        </span>
                        <span className="font-mono text-[12px] text-muted tabular whitespace-nowrap">
                          {shortSha(e.new_sha)}
                          <span className="text-subtle px-2">·</span>
                          {timeAgo(e.timestamp)}
                        </span>
                      </li>
                    );
                  })}
                  {distinctEvents !== null && distinctEvents.length === 0 && (
                    <li className="py-6 text-[13px] text-muted">
                      No gossip from peer nodes yet.
                    </li>
                  )}
                </ol>
              )}
            </Section>

            {/* In the main column, not below the grid. The sidebar runs about
                920px while "Latest ref-update" and "Recent activity" together
                come to roughly 530, so the left column used to end in ~390px of
                dead space. Six repository cards two-up fill almost exactly that,
                which balances the two columns instead of padding one. */}
            <Section
              title="Repositories on this node"
              action={
                <Link to="/repos" className="text-[13px] text-accent hover:underline">
                  View all
                </Link>
              }
            >
              <RepoShowcase repos={recentRepos} loading={loading} totalCount={stats?.repos} />
            </Section>
          </div>

          {/* Sidebar — plain sections, hairline-divided. No boxes. */}
          <aside className="min-w-0 flex flex-col gap-6">

            <Section title="Clone a repository">
              {/* Name the repository. The terminal demonstrates a real command
                  against a real repo on this node, but the command wraps a
                  ~60-character did:key remote across three lines, so which repo
                  it clones was effectively unreadable — and the copy button
                  below said only "Copy clone command", for something the reader
                  could not identify. */}
              {cloneRepo && (
                <p className="m-0 mb-2.5 text-[12.5px] text-muted">
                  Demonstrated on{' '}
                  <Link
                    to={`/repos/${encodeURIComponent(cloneRepo.owner_did)}/${encodeURIComponent(cloneRepo.name)}`}
                    className="font-mono text-accent hover:underline"
                  >
                    {shortDid(cloneRepo.owner_did)}/{cloneRepo.name}
                  </Link>
                  , one of this node&rsquo;s repositories.
                </p>
              )}
              {cloneRepo ? (
                // Magic UI's Terminal ships `h-full max-h-100`, sized for a
                // fixed-height parent; in an auto-height section it overflows
                // and collides with whatever follows. h-auto pins it to its
                // content, and the lines wrap because a did:key remote is ~60
                // characters and will not fit a sidebar column.
                <Terminal
                  className="h-auto max-h-none w-full max-w-full min-h-0 bg-canvas-inset border-border
                    [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_pre]:p-3
                    [&>div:first-child]:p-3"
                >
                  <TypingAnimation duration={22} className="text-[12px] text-muted">
                    {`$ git clone "${cloneUrl(cloneRepo.owner_did, cloneRepo.name)}"`}
                  </TypingAnimation>
                  <AnimatedSpan delay={2400} className="text-[12px] text-success">
                    ✓ Signature verified against pusher DID
                  </AnimatedSpan>
                  <AnimatedSpan delay={3000} className="text-[12px] text-muted">
                    Cloned into ./{cloneRepo.name}
                  </AnimatedSpan>
                </Terminal>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
              <p className="m-0 mt-2.5 text-[12px] text-muted leading-relaxed">
                Requires <code className="font-mono">gl</code> and{' '}
                <code className="font-mono">git-remote-gitlawb</code> —{' '}
                <Link to="/docs/quickstart" className="text-accent hover:underline">
                  quickstart
                </Link>
                {cloneRepo && (
                  <>
                    {' '}· or over{' '}
                    <a
                      href={cloneRepo.clone_url}
                      target="_blank"
                      rel="noopener"
                      className="text-accent hover:underline"
                    >
                      https
                    </a>
                  </>
                )}
                .
              </p>
              {cloneRepo && (
                // Ripple gives the press real feedback, and the confetti fires
                // only once the clipboard write actually resolves — it reports
                // success, it does not celebrate a click.
                <ConfettiButton
                  options={{ particleCount: 45, spread: 55, startVelocity: 22, scalar: 0.7 }}
                  asChild
                >
                  <RippleButton
                    rippleColor="var(--color-accent)"
                    className="mt-2 h-8 px-3 text-[13px] border border-border bg-surface-secondary
                      text-foreground hover:bg-surface-tertiary"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `git clone "${cloneUrl(cloneRepo.owner_did, cloneRepo.name)}"`,
                      )
                    }
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Copy size={13} /> Copy command for {cloneRepo.name}
                    </span>
                  </RippleButton>
                </ConfettiButton>
              )}
            </Section>

            <Section
              title="Agent tasks"
              action={
                <Link to="/tasks" className="text-[13px] text-accent hover:underline">
                  View all
                </Link>
              }
            >
              {/* A bar before the numbers. This register is overwhelmingly one
                  status — 198 of 200 completed on this node — and four figures
                  side by side make that read as four comparable quantities.
                  The bar shows the proportion at a glance; the numbers below
                  stay for the exact values. Widths come from the same counts,
                  so the two cannot disagree. */}
              {tasks && tasks.length > 0 && (
                <div
                  className="mb-3 flex h-1.5 w-full overflow-hidden rounded-[var(--radius-control)] bg-surface-secondary"
                  role="img"
                  aria-label={taskCounts
                    .filter(t => t.count > 0)
                    .map(t => `${t.count} ${t.status}`)
                    .join(', ')}
                >
                  {taskCounts
                    .filter(({ count }) => count > 0)
                    .map(({ status, count }) => (
                      <span
                        key={status}
                        title={`${count} ${status}`}
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                        className={cn('h-full', taskStatusFill(status))}
                      />
                    ))}
                </div>
              )}

              <dl className="flex flex-wrap gap-x-6 gap-y-2 m-0 mb-3">
                {taskCounts.map(({ status, count }) => (
                  <div key={status} className="flex items-baseline gap-1.5">
                    <dd className={cn('m-0 text-[14px] font-semibold tabular', taskStatusColor(status))}>
                      {tasks ? count : '—'}
                    </dd>
                    <dt className="text-[12px] text-muted capitalize">{status}</dt>
                  </div>
                ))}
              </dl>
              <ul className="m-0 p-0 list-none">
                {(tasks ?? []).slice(0, 4).map(task => (
                  <li key={task.id} className="border-t border-separator first:border-t-0">
                    <Link
                      to={`/tasks/${encodeURIComponent(task.id)}`}
                      className="flex items-center gap-2 py-1.5 min-w-0 group"
                    >
                      <Circle size={6} className={cn('shrink-0', taskStatusColor(task.status))} fill="currentColor" />
                      <span className="text-[13px] truncate flex-1 text-foreground group-hover:text-accent transition-colors">
                        {taskTitle(task)}
                      </span>
                      <span className="text-[11px] text-muted tabular whitespace-nowrap">
                        {timeAgo(task.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {openTasks && (
                <p className="m-0 mt-2 text-[12px] text-muted">
                  {openTasks.length} open of the latest {tasks?.length ?? 0}
                </p>
              )}
            </Section>

            <Section
              title="P2P gossip"
              action={
                <Link to="/network" className="text-[13px] text-accent hover:underline">
                  Network
                </Link>
              }
            >
              {/* The beams are drawn only when libp2p actually reports
                  connected peers.

                  They used to be driven by `peers.filter(p => p.reachable)`,
                  which is HTTP reachability from GET /peers — a different fact
                  entirely from gossip connectivity. On this node that produced
                  three animated links to named peers directly above the line
                  "0 connected · 0 in mesh": the picture asserted a live mesh
                  while the numbers in the same section denied it. Measured:
                  16 HTTP-reachable peers, connected_peers 0, mesh 0. */}
              {p2p?.enabled && meshLinks > 0 && (
                <div ref={gossipRef} className="relative py-4 mb-2">
                  <div className="flex items-center justify-between">
                    <div
                      ref={selfRef}
                      className="z-10 flex size-9 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-semibold text-foreground"
                    >
                      node
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {/* Unlabelled on purpose. /p2p/info reports how many peers
                          are connected but not which, so naming them would mean
                          borrowing identities from the HTTP peer list and
                          claiming a libp2p link the API never asserted. */}
                      {Array.from({ length: meshLinks }, (_, i) => (
                        <div
                          key={i}
                          ref={peerRefs[i]}
                          className="z-10 size-7 rounded-full border border-border bg-surface"
                        />
                      ))}
                    </div>
                  </div>
                  {Array.from({ length: meshLinks }, (_, i) => (
                    <AnimatedBeam
                      key={i}
                      containerRef={gossipRef}
                      fromRef={selfRef}
                      toRef={peerRefs[i]}
                      curvature={(i - (meshLinks - 1) / 2) * 18}
                      duration={4}
                      delay={i * 0.7}
                      pathColor="var(--color-border)"
                      gradientStartColor="var(--color-foreground)"
                      gradientStopColor="var(--color-success)"
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 text-[13px] text-muted">
                <span className="inline-flex items-center gap-2">
                  <Circle
                    size={7}
                    className={p2p?.enabled ? 'text-success' : 'text-muted'}
                    fill="currentColor"
                  />
                  {p2p ? (p2p.enabled ? 'Enabled' : 'Disabled') : loading ? 'Checking…' : 'Unknown'}
                </span>
                {typeof p2p?.connected_peers === 'number' && (
                  <span className="tabular">
                    {p2p.connected_peers} connected · {p2p.gossipsub_mesh_peers ?? 0} in mesh
                  </span>
                )}

                {/* Zero connected peers with the transport enabled is a normal
                    state, not a missing figure: gossip arrives in bursts and
                    the mesh is empty between them. Saying so stops an empty
                    diagram reading as a broken section. */}
                {p2p?.enabled && meshLinks === 0 && (
                  <span>
                    No peers connected over libp2p right now — the feed above is
                    what has arrived so far.
                  </span>
                )}

                {typeof reachablePeers === 'number' && (
                  <span className="tabular">
                    {reachablePeers} of {peers?.length ?? 0} known peers answer over HTTP
                  </span>
                )}

                {p2p?.topics?.map(t => (
                  <code key={t} className="font-mono text-[11.5px] break-all">{t}</code>
                ))}
              </div>
            </Section>
          </aside>
        </div>
      )}

      {/* ── Below the fold ───────────────────────────────────────────────────
          The two-column grid ends wherever the activity list runs out, and the
          sidebar is taller than the main column, so the page used to bottom out
          into dead space. These run full width: what is hosted here, the
          machine-readable surface the product is built on, and where to go
          next. */}
      {!unreachable && (
        <div className="flex flex-col gap-12 pb-20">
          <Section title="Built for agents">
            <AgentSurface />
          </Section>

          <StartHere />
        </div>
      )}
    </div>
  );
}
