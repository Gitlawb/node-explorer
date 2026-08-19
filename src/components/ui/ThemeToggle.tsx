import { AnimatedThemeToggler } from './animated-theme-toggler';
import { useTheme } from '../../hooks/useTheme';

/**
 * Theme switch.
 *
 * Magic UI's AnimatedThemeToggler drives the visual: it wipes the new theme in
 * over the old one with the View Transitions API, and falls back to an instant
 * swap where that API is missing.
 *
 * It runs controlled — the toggler flips the `dark` class synchronously so the
 * transition snapshots the new theme, then hands the value back here, and
 * useTheme stays the single owner of `data-theme` and the stored preference.
 * Letting it manage its own state would have it write the pre-redesign
 * `theme` key, which is exactly the stale value we retired.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      duration={450}
      variant="circle"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      // No border and no box. `border border-transparent` does not work here:
      // the global `*` reset sets border-color, so a transparent border still
      // paints as a 1px frame. The icon is sized down from the component's
      // 24px default, which was cramped inside a 32px hit area.
      className="inline-flex h-8 w-8 items-center justify-center
        text-muted transition-colors hover:text-foreground
        [&_svg]:size-[17px]"
    />
  );
}
