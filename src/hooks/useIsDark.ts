import { useSyncExternalStore } from 'react';

/**
 * Whether the dark theme is currently applied.
 *
 * Canvas-based components (the globe, the icon cloud) bake colours into
 * textures and image URLs, so they need to re-render when the theme flips.
 * `useTheme` cannot serve that: it holds its own useState per call site, so a
 * second caller would track its own copy and never hear about the toggle.
 * This subscribes to the class on <html>, which is the single source of truth
 * every theme path already writes to.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains('dark');

export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
