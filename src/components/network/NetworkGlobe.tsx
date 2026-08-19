import { useMemo } from 'react';
import type { COBEOptions } from 'cobe';
import { Globe } from '../ui/globe';
import { useIsDark } from '../../hooks/useIsDark';

/**
 * A globe behind the network header.
 *
 * Deliberately illustrative. The node API exposes no geography — a peer record
 * is `{ did, http_url, last_seen, reachable }` and nothing more — so these
 * markers are a stock world spread, not peer locations. The section is framed
 * that way on purpose: a map pin gets read as a claim about where a machine
 * is, and the real federation view lives in the topology diagram and the node
 * cards below, which are driven by actual reachability.
 */

/** A stock spread of world cities. Decorative — not peer positions. */
const ILLUSTRATIVE_MARKERS: COBEOptions['markers'] = [
  { location: [14.5995, 120.9842], size: 0.03 },
  { location: [19.076, 72.8777], size: 0.06 },
  { location: [30.0444, 31.2357], size: 0.05 },
  { location: [39.9042, 116.4074], size: 0.06 },
  { location: [-23.5505, -46.6333], size: 0.06 },
  { location: [19.4326, -99.1332], size: 0.05 },
  { location: [40.7128, -74.006], size: 0.07 },
  { location: [51.5072, -0.1276], size: 0.06 },
  { location: [35.6762, 139.6503], size: 0.05 },
  { location: [-33.8688, 151.2093], size: 0.04 },
];

export function NetworkGlobe() {
  const isDark = useIsDark();

  // COBEOptions is a complete object; the component replaces its default
  // wholesale rather than merging, so every field has to be supplied. The
  // sphere is painted into a canvas, so its colours cannot come from CSS
  // tokens and have to be switched here when the theme flips — a dark sphere
  // on the light ground reads as a hole in the page.
  const config = useMemo<COBEOptions>(
    () => ({
      width: 800,
      height: 800,
      onRender: () => {},
      devicePixelRatio: 2,
      phi: 0,
      theta: 0.3,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 0.4 : 1.2,
      mapSamples: 16000,
      mapBrightness: isDark ? 1.2 : 6,
      // Monochrome sphere either way; markers keep the one colour this palette
      // carries, darkened on light so they stay legible.
      baseColor: isDark ? [0.32, 0.32, 0.32] : [0.86, 0.86, 0.86],
      glowColor: isDark ? [0.12, 0.12, 0.12] : [0.9, 0.9, 0.9],
      markerColor: isDark ? [0.02, 0.87, 0.45] : [0, 0.44, 0.18],
      markers: ILLUSTRATIVE_MARKERS,
    }),
    [isDark],
  );

  // The globe is smaller on a phone. The sphere is decorative — the markers
  // are a stock world spread, not peer positions — and at 343px square it took
  // most of a screen, nearly all of it dark sphere against a dark ground.
  return (
    <div className="relative mx-auto w-full max-w-[250px] sm:max-w-[460px] aspect-square">
      <Globe config={config} className="top-0" />
    </div>
  );
}
