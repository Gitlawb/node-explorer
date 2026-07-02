import { useRef, useEffect, useMemo } from 'react';
import { startPrefetch, cancelPrefetch, repoCacheKey } from '../lib/repoCache';

const HOVER_DELAY_MS = 65;

/**
 * Hover/focus-intent prefetch for a repo detail route. Spread the returned
 * handlers on the row element; keyboard roving focus prefetches too.
 */
export function usePrefetchRepo(owner: string, name: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useMemo(() => {
    const start = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => startPrefetch(owner, name), HOVER_DELAY_MS);
    };
    const stop = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      cancelPrefetch(repoCacheKey(owner, name));
    };
    return { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop };
  }, [owner, name]);
}
