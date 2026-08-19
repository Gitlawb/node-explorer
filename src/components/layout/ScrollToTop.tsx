import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Reset the scroll position when the visitor moves to a different page.
 *
 * A browser scrolls to the top on a real navigation; a single-page app does
 * not, because nothing about the document changes. Without this, following the
 * "Next" pager at the foot of a document loaded the next document and left the
 * reader parked at the bottom of it, looking at the pager again — the content
 * had changed but the viewport had not moved.
 *
 * Three cases are deliberately left alone:
 *
 * - Back and forward. `POP` means the browser is restoring a position the
 *   visitor already had, and overriding that loses their place.
 * - Anything carrying a hash, which names a specific heading to land on. The
 *   page owning that anchor scrolls to it once its content has rendered.
 * - Query-string changes. Search, filters, sorting and paging all rewrite the
 *   query while staying on the same page; scrolling on those would yank the
 *   view to the top on every keystroke typed into a search field.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    const changedPage = previousPathname.current !== pathname;
    previousPathname.current = pathname;

    if (!changedPage) return;
    if (navigationType === 'POP') return;
    if (hash) return;

    // Instant, not smooth: this is a page change, and animating it makes the
    // new page appear to scroll past content the visitor never asked to see.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, navigationType]);

  return null;
}
