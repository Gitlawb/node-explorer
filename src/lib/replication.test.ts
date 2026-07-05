import { describe, it, expect } from 'vitest';
import { analyzeReplication, toEventTuples, tupleKey } from './replication';
import type { ApiRefUpdate } from './api';

const event = (overrides: Partial<ApiRefUpdate>): ApiRefUpdate => ({
  id: 'e1',
  node_did: 'did:key:origin',
  pusher_did: 'did:key:pusher',
  repo: 'z6MkKey/repo',
  ref_name: 'refs/heads/main',
  old_sha: '0'.repeat(40),
  new_sha: 'a'.repeat(40),
  timestamp: '2026-07-01T00:00:00Z',
  cert_id: null,
  received_at: '2026-07-01T00:00:01Z',
  from_peer: null,
  ...overrides,
});

describe('toEventTuples', () => {
  it('keys tuples on origin/repo/ref/sha', () => {
    const [t] = toEventTuples([event({})]);
    expect(t.key).toBe(tupleKey('did:key:origin', 'z6MkKey/repo', 'refs/heads/main', 'a'.repeat(40)));
  });
});

describe('analyzeReplication', () => {
  const e1 = event({});
  const e2 = event({ new_sha: 'b'.repeat(40), timestamp: '2026-07-02T00:00:00Z' });

  it('marks the origin node and computes full coverage', () => {
    const feeds = [
      { label: 'n1', did: 'did:key:origin', feed: toEventTuples([e1]) },
      { label: 'n2', did: 'did:key:other', feed: toEventTuples([e1]) },
    ];
    const status = analyzeReplication(feeds);
    expect(status.totalTuples).toBe(1);
    expect(status.coveragePercent).toBe(100);
    expect(status.rows[0].presence).toEqual({ n1: 'origin', n2: 'replicated' });
    expect(status.driftByNode).toEqual({ n1: 0, n2: 0 });
  });

  it('counts drift for nodes missing a tuple and sorts rows newest-first', () => {
    const feeds = [
      { label: 'n1', did: 'did:key:origin', feed: toEventTuples([e1, e2]) },
      { label: 'n2', did: 'did:key:other', feed: toEventTuples([e1]) },
    ];
    const status = analyzeReplication(feeds);
    expect(status.totalTuples).toBe(2);
    expect(status.fullyReplicatedCount).toBe(1);
    expect(status.coveragePercent).toBe(50);
    expect(status.driftByNode.n2).toBe(1);
    // newest (e2) first
    expect(status.rows[0].tuple.new_sha).toBe('b'.repeat(40));
    expect(status.rows[0].presence.n2).toBe('missing');
  });

  it('treats an origin outside the fan-out as replicated-only rows', () => {
    const foreign = event({ node_did: 'did:key:unknown-node' });
    const feeds = [
      { label: 'n1', did: 'did:key:a', feed: toEventTuples([foreign]) },
      { label: 'n2', did: 'did:key:b', feed: [] },
    ];
    const status = analyzeReplication(feeds);
    expect(status.rows[0].presence).toEqual({ n1: 'replicated', n2: 'missing' });
  });
});
