/**
 * Dependency-free fuzzy subsequence matcher (fzf-flavoured scoring).
 * Returns null when not every query char appears in order in the candidate.
 */
export function fuzzyScore(query: string, candidate: string): number | null {
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  if (q.length === 0) return 0;
  if (q.length > c.length) return null;

  const basenameStart = c.lastIndexOf('/') + 1;
  let score = 0;
  let ci = 0;
  let prevMatch = -2;

  for (let qi = 0; qi < q.length; qi++) {
    const idx = c.indexOf(q[qi], ci);
    if (idx === -1) return null;

    if (idx === prevMatch + 1) score += 3; // consecutive run
    if (idx === basenameStart) score += 8; // start of basename
    else if (idx > 0 && (c[idx - 1] === '/' || c[idx - 1] === '.')) score += 5; // segment boundary
    score -= Math.min(idx - ci, 10) * 0.5; // gap penalty (capped)

    prevMatch = idx;
    ci = idx + 1;
  }
  // Prefer shorter candidates at equal match quality
  return score - candidate.length * 0.01;
}

export function fuzzyFilter(query: string, candidates: string[], limit = 50): string[] {
  const trimmed = query.trim();
  if (!trimmed) return candidates.slice(0, limit);

  const scored: { c: string; s: number }[] = [];
  for (const c of candidates) {
    const s = fuzzyScore(trimmed, c);
    if (s !== null) scored.push({ c, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map(x => x.c);
}
