import { describe, it, expect } from 'vitest';
import { bucketCommitDates, ACTIVITY_WEEKS } from './activity';

const NOW = new Date('2026-07-01T12:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(NOW - n * DAY).toISOString();
}

describe('bucketCommitDates', () => {
  it('returns all-zero buckets for no commits', () => {
    const buckets = bucketCommitDates([], NOW);
    expect(buckets).toHaveLength(ACTIVITY_WEEKS);
    expect(buckets.every(b => b === 0)).toBe(true);
  });

  it('puts a commit from today in the newest bucket', () => {
    const buckets = bucketCommitDates([daysAgo(0)], NOW);
    expect(buckets[ACTIVITY_WEEKS - 1]).toBe(1);
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('puts a commit from 6 days ago in the newest bucket too', () => {
    const buckets = bucketCommitDates([daysAgo(6)], NOW);
    expect(buckets[ACTIVITY_WEEKS - 1]).toBe(1);
  });

  it('puts a commit from 8 days ago in the second-newest bucket', () => {
    const buckets = bucketCommitDates([daysAgo(8)], NOW);
    expect(buckets[ACTIVITY_WEEKS - 2]).toBe(1);
  });

  it('drops commits older than the window', () => {
    const buckets = bucketCommitDates([daysAgo(ACTIVITY_WEEKS * 7 + 1)], NOW);
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('counts future-dated commits (clock skew) as this week', () => {
    const buckets = bucketCommitDates([new Date(NOW + DAY).toISOString()], NOW);
    expect(buckets[ACTIVITY_WEEKS - 1]).toBe(1);
  });

  it('ignores unparseable dates', () => {
    const buckets = bucketCommitDates(['not-a-date', daysAgo(1)], NOW);
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('accumulates multiple commits in the same week', () => {
    const buckets = bucketCommitDates([daysAgo(0), daysAgo(1), daysAgo(2)], NOW);
    expect(buckets[ACTIVITY_WEEKS - 1]).toBe(3);
  });
});
