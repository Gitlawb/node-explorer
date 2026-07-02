import { useContext, useEffect, useRef, type RefObject } from 'react';
import { ShortcutsContext, type ShortcutsCtx } from '../lib/shortcuts';

export function useShortcuts(): ShortcutsCtx {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error('useShortcuts must be used inside ShortcutsProvider');
  return ctx;
}

/** Register a global shortcut for the lifetime of the calling component. */
export function useShortcut(key: string, handler: (e: KeyboardEvent) => void): void {
  const { register } = useShortcuts();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return register(key, e => handlerRef.current(e));
  }, [key, register]);
}

/**
 * j/k roving focus over rows: focuses the next/previous `a[data-row-link]`
 * inside the container. Focus itself triggers focus-visible rings (keyboard
 * interaction) and any onFocus side effects (e.g. prefetch).
 */
export function useListNav(containerRef: RefObject<HTMLElement | null>): void {
  // Defined-but-not-called during render; runs only on keydown.
  const move = (dir: 1 | -1, e: KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[data-row-link]'));
    if (links.length === 0) return;
    e.preventDefault();
    const idx = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = idx === -1 ? (dir === 1 ? 0 : links.length - 1) : Math.min(Math.max(idx + dir, 0), links.length - 1);
    links[next].focus();
  };

  useShortcut('j', e => move(1, e));
  useShortcut('k', e => move(-1, e));
}
