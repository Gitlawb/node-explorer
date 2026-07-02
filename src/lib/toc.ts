export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract linkable headings from rendered markdown HTML (ids come from
 * marked-gfm-heading-id). Pure — call from useMemo, not an effect.
 */
export function extractTocHeadings(html: string): TocHeading[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = doc.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
  const headings: TocHeading[] = [];
  nodes.forEach(node => {
    const text = (node.textContent ?? '').trim();
    if (!text) return;
    headings.push({
      id: node.id,
      text,
      level: Number(node.tagName.slice(1)),
    });
  });
  return headings;
}
