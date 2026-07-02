import { useState, useEffect, useMemo } from 'react';
import { getShikiLangFromPath } from '../../lib/lang';
import { parseLineHash, formatLineHash } from '../../lib/lineRange';
import { cn } from '../../lib/utils';

interface CodeViewProps {
  content: string;
  path: string;
  wrap?: boolean;
}

/**
 * Line-numbered code view with lazy shiki highlighting, #L10 / #L10-L25 range
 * anchors (click = line, shift+click = extend range), and optional soft wrap.
 * Mount with key={path} so state resets per file.
 */
export function CodeView({ content, path, wrap = false }: CodeViewProps) {
  const lines = useMemo(() => content.split('\n'), [content]);
  const lang = useMemo(() => getShikiLangFromPath(path), [path]);
  const [htmlLines, setHtmlLines] = useState<string[] | null>(null);
  // Mounted with key={path}, so lang-derived initial state is per-file correct
  const [settled, setSettled] = useState(lang === null);
  const [range, setRange] = useState<[number, number] | null>(() => parseLineHash(window.location.hash));

  useEffect(() => {
    if (!lang) return;
    let cancelled = false;
    // Lazy chunk: shiki core loads on first highlighted file view
    import('../../lib/highlight')
      .then(({ highlightToHtmlLines }) => highlightToHtmlLines(content, lang))
      .then(result => {
        if (cancelled) return;
        if (result) setHtmlLines(result);
        setSettled(true);
      });
    return () => { cancelled = true; };
  }, [content, lang]);

  // Back/forward and manual URL edits
  useEffect(() => {
    const onHashChange = () => setRange(parseLineHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Content mounts after async fetch/highlight, so the browser's native hash
  // scroll misses — do it explicitly once rendering settles.
  useEffect(() => {
    if (!settled) return;
    const parsed = parseLineHash(window.location.hash);
    if (parsed) document.getElementById(`L${parsed[0]}`)?.scrollIntoView({ block: 'center' });
  }, [settled]);

  const handleGutterClick = (e: React.MouseEvent, n: number) => {
    e.preventDefault();
    const next: [number, number] =
      e.shiftKey && range ? [Math.min(range[0], n), Math.max(range[1], n)] : [n, n];
    setRange(next);
    // replaceState avoids history spam; highlight is class-driven, not :target
    history.replaceState(null, '', `${location.pathname}${location.search}#${formatLineHash(next)}`);
  };

  return (
    <div className="overflow-auto max-h-[75vh]">
      <table className={cn('code-table w-full text-[12px] sm:text-[13px]', wrap && 'table-fixed')}>
        <tbody>
          {lines.map((line, i) => {
            const n = i + 1;
            const inRange = range !== null && n >= range[0] && n <= range[1];
            return (
              <tr key={n} id={`L${n}`} className={cn('scroll-mt-14', inRange && 'line-hl')}>
                <td className="w-[1%] pr-3 pl-4 text-right align-top select-none border-r border-border-inner">
                  <a
                    href={`#L${n}`}
                    onClick={e => handleGutterClick(e, n)}
                    className="text-dim tabular-nums hover:text-muted-foreground"
                  >
                    {n}
                  </a>
                </td>
                <td
                  className={cn(
                    'px-4 leading-relaxed text-foreground',
                    wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                  )}
                >
                  {htmlLines ? (
                    <span dangerouslySetInnerHTML={{ __html: htmlLines[i] || ' ' }} />
                  ) : (
                    line || ' '
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
