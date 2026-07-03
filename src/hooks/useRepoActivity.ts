import { useEffect, useRef, useState } from 'react';
import { getCachedActivity, loadActivity } from '../lib/activity';

/**
 * Lazy weekly-activity buckets for a repo row. Attach `ref` to the row
 * element — the fetch only starts once the row scrolls near the viewport,
 * so paging through the list doesn't hammer the node.
 * `activity` is null while loading, [] when unavailable.
 */
export function useRepoActivity(owner: string, name: string) {
  const ref = useRef<HTMLLIElement>(null);
  const [activity, setActivity] = useState<number[] | null>(
    () => getCachedActivity(owner, name) ?? null,
  );

  useEffect(() => {
    if (getCachedActivity(owner, name)) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        observer.disconnect();
        void loadActivity(owner, name).then(buckets => {
          if (!cancelled) setActivity(buckets);
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [owner, name]);

  return { ref, activity };
}
