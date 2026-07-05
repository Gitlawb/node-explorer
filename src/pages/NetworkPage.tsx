import { useRefreshKey } from '../hooks/useRefreshKey';
import { useNetwork } from '../hooks/useNetwork';
import { FEDERATED_NODES } from '../lib/nodes';
import { RepoHero } from '../components/repos/RepoHero';
import { NodeCard, NodeCardSkeleton } from '../components/network/NodeCard';
import { ReplicationTable } from '../components/network/ReplicationTable';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Skeleton } from '../components/ui/Skeleton';

export default function NetworkPage() {
  const { refreshKey, refresh } = useRefreshKey();
  const { snapshots, replication, loading } = useNetwork(refreshKey);

  const live = snapshots?.filter(s => s.reachable).length;
  const clusterRepos = snapshots
    ? Math.max(0, ...snapshots.map(s => s.stats?.repos ?? 0))
    : null;
  const clusterAgents = snapshots
    ? snapshots.reduce((sum, s) => sum + (s.stats?.agents ?? 0), 0)
    : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">

      <RepoHero
        totalCount={live ?? 0}
        page={1}
        perPage={FEDERATED_NODES.length}
        windowStart={1}
        windowEnd={FEDERATED_NODES.length}
        refreshing={loading}
        onRefresh={refresh}
        title="network."
        indexLabel="federation status"
        countNoun="nodes live"
        description={
          <p className="m-0">
            The gitlawb federation: independent nodes replicating repos to each other. Each push is
            certified on its origin node, announced on the{' '}
            <code className="text-warm-text">gitlawb/ref-updates/v1</code> gossip topic, and picked
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

      <div className="pt-8 pb-20 flex flex-col gap-6">

        {/* Node cards */}
        <section>
          <MicroLabel className="block mb-3">nodes</MicroLabel>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
          <div className="border border-border py-12 text-center">
            <p className="m-0 text-[13px] text-muted-foreground">
              replication analysis needs event feeds from at least two nodes
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
