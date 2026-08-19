import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

/**
 * The stored preference is versioned.
 *
 * The previous design defaulted to dark and persisted `theme: "dark"` for every
 * visitor. This design is printed on light stock, with dark as the counterfoil.
 * Reading the old key would hand every returning visitor the counterfoil and
 * hide the redesign from exactly the people who had seen the old one — so the
 * legacy value is deliberately not inherited. A visitor who wants dark picks it
 * again once, and that choice is stored under the new key.
 */
const KEY = 'gl-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    // Retire the pre-redesign key so it cannot resurface later.
    localStorage.removeItem('theme');

    // Force a full style recalculation.
    //
    // Every themed colour resolves through an inherited custom property
    // (`.text-muted { color: var(--fg-muted) }`), and Chromium does not
    // reliably invalidate `color` on elements that already exist when such a
    // property changes on the root. Measured after a toggle: 76 of 236
    // `.text-muted` elements kept the previous theme's colour — white text on
    // the white ground — while a freshly created element with the same class
    // in the same parent resolved correctly. Detaching and reattaching the
    // document element forces the engine to recompute the whole tree.
    const display = root.style.display;
    root.style.display = 'none';
    void root.offsetHeight;
    root.style.display = display;
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle, setTheme };
}
