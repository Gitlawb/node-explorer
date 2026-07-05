import { useEffect, useState } from 'react';

/**
 * Visibility-aware polling tick: increments `tick` every `intervalMs` while
 * enabled and the tab is visible, and fires immediately on tab re-focus so a
 * stale page catches up without waiting a full interval.
 */
export function useAutoRefresh(intervalMs: number, enabled: boolean): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null) timer = setInterval(() => setTick(t => t + 1), intervalMs);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        setTick(t => t + 1);
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);

  return tick;
}
