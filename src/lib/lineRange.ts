export function parseLineHash(hash: string): [number, number] | null {
  const m = /^#L(\d+)(?:-L(\d+))?$/.exec(hash);
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  if (a < 1 || b < 1) return null;
  return [Math.min(a, b), Math.max(a, b)];
}

export function formatLineHash([start, end]: [number, number]): string {
  return start === end ? `L${start}` : `L${start}-L${end}`;
}
