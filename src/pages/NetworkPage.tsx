import { useNetwork } from '../hooks/useNetwork';
import { FEDERATED_NODES } from '../lib/nodes';
import { RepoHero } from '../components/repos/RepoHero';
import { NodeCard, NodeCardSkeleton } from '../components/network/NodeCard';
import { ReplicationTable } from '../components/network/ReplicationTable';
import { FederationMap } from '../components/network/FederationMap';
import { NetworkGlobe } from '../components/network/NetworkGlobe';
import { AnimatedCircularProgressBar } from '../components/ui/animated-circular-progress-bar';
import { Skeleton } from '../components/ui/Skeleton';

export default function NetworkPage() {
  const { snapshots, replication } = useNetwork();

  const live = snapshots?.filter(s => s.reachable).length;
  const clusterRepos = snapshots
    ? Math.max(0, ...snapshots.map(s => s.stats?.repos ?? 0))
    : null;
  const clusterAgents = snapshots
    ? snapshots.reduce((sum, s) => sum + (s.stats?.agents ?? 0), 0)
    : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      <RepoHero
        totalCount={live ?? 0}
        page={1}
        perPage={FEDERATED_NODES.length}
        windowStart={1}
        windowEnd={FEDERATED_NODES.length}
        title="Network"
        countNoun="nodes live"
        description={
          <p className="m-0">
            The gitlawb federation: independent nodes replicating repos to each other. Each push is
            certified on its origin node, announced on the{' '}
            <code className="text-accent">gitlawb/ref-updates/v1</code> gossip topic, and picked
            up by every peer. Below, the same feed observed from each node — and how far each one
            lags.
          </p>
        }
        cells={[
          {
            label: 'nodes live',
            value: live !== undefined ? `${live}/${FEDERATED_NODES.length}` : '—',
          },
          { label: 'cluster repos', value: clusterRepos !== null && clusterRepos > 0 ? clusterRepos.toLocaleString() : '—' },
          { label: 'cluster agents', value: clusterAgents !== null && clusterAgents > 0 ? clusterAgents.toLocaleString() : '—' },
          {
            label: 'replication',
            value: replication ? `${replication.coveragePercent}%` : '—',
          },
        ]}
      />

      <div className="pt-4 pb-20 flex flex-col gap-8">

        {/* The globe is illustrative — the node API carries no coordinates, so
            its markers are a stock spread rather than peer positions. The
            federation's real state is the topology below it and the node cards
            under that, both driven by live reachability. */}
        <section className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="min-w-0">
            {snapshots && snapshots.length > 1 && <FederationMap snapshots={snapshots} />}
          </div>
          <NetworkGlobe />
        </section>

        {/* Coverage gauge + node cards */}
        <section>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-2 mb-4">
            <h2 className="m-0 text-[16px] font-semibold text-foreground">Nodes</h2>
            {replication && (
              <span className="flex items-center gap-2.5">
                <span className="text-[13px] text-muted">Replication coverage</span>
                <AnimatedCircularProgressBar
                  value={replication.coveragePercent}
                  min={0}
                  max={100}
                  gaugePrimaryColor="var(--color-success)"
                  gaugeSecondaryColor="var(--color-separator)"
                  className="size-11 text-[11px]"
                />
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {snapshots === null
              ? FEDERATED_NODES.map(n => <NodeCardSkeleton key={n.id} />)
              : snapshots.map(s => <NodeCard key={s.node.id} snapshot={s} />)}
          </div>
        </section>

        {/* Replication */}
        {replication ? (
          <ReplicationTable
            replication={replication}
            labels={(snapshots ?? [])
              .filter(s => s.events !== null)
              .map(s => s.node.label)}
          />
        ) : snapshots === null ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="border-t border-border py-12 text-center">
            <p className="m-0 text-[13px] text-muted">
              replication analysis needs event feeds from at least two nodes
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
