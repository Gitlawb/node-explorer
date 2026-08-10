import { useState, useEffect, useCallback } from 'react';
import { Palette } from 'lucide-react';
import { Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { cn } from '../../lib/utils';

type Accent =
  | 'purple'
  | 'blue'
  | 'indigo'
  | 'teal'
  | 'green'
  | 'orange'
  | 'pink'
  | 'red'
  | 'amber'
  | 'violet';

type Base = 'neutral' | 'slate' | 'warm' | 'olive' | 'sand';

type Font =
  | 'jetbrains-mono'
  | 'inter'
  | 'ibm-plex-mono'
  | 'fira-code'
  | 'geist'
  | 'space-grotesk'
  | 'source-code-pro'
  | 'dm-mono'
  | 'jakarta-sans'
  | 'onest';

type Rad = 'none' | 'sm' | 'md' | 'lg';

interface ThemeSettings {
  accent: Accent;
  base: Base;
  font: Font;
  radius: Rad;
}

interface AccentDef {
  oklch: string;
  oklchForeground: string;
  css: string;
  cssForeground: string;
}

const ACCENTS: Record<Accent, AccentDef> = {
  purple: {
    oklch: 'oklch(78% 0.16 295.38)',
    oklchForeground: 'oklch(15% 0.03 295.38)',
    css: 'hsl(295.38, 100%, 70%)',
    cssForeground: 'hsl(295.38, 100%, 5%)',
  },
  blue: {
    oklch: 'oklch(70% 0.18 260)',
    oklchForeground: 'oklch(15% 0.03 260)',
    css: 'hsl(220, 100%, 60%)',
    cssForeground: 'hsl(220, 100%, 5%)',
  },
  indigo: {
    oklch: 'oklch(65% 0.19 275)',
    oklchForeground: 'oklch(15% 0.03 275)',
    css: 'hsl(245, 90%, 60%)',
    cssForeground: 'hsl(245, 90%, 5%)',
  },
  teal: {
    oklch: 'oklch(75% 0.14 195)',
    oklchForeground: 'oklch(15% 0.03 195)',
    css: 'hsl(180, 80%, 50%)',
    cssForeground: 'hsl(180, 80%, 5%)',
  },
  green: {
    oklch: 'oklch(73% 0.19 155.8)',
    oklchForeground: 'oklch(15% 0.03 155.8)',
    css: 'hsl(150, 80%, 50%)',
    cssForeground: 'hsl(150, 80%, 5%)',
  },
  orange: {
    oklch: 'oklch(78% 0.159 77.32)',
    oklchForeground: 'oklch(15% 0.03 77.32)',
    css: 'hsl(30, 100%, 55%)',
    cssForeground: 'hsl(30, 100%, 5%)',
  },
  pink: {
    oklch: 'oklch(75% 0.18 340)',
    oklchForeground: 'oklch(15% 0.03 340)',
    css: 'hsl(330, 100%, 65%)',
    cssForeground: 'hsl(330, 100%, 5%)',
  },
  red: {
    oklch: 'oklch(65% 0.23 25.74)',
    oklchForeground: 'oklch(99% 0 0)',
    css: 'hsl(0, 85%, 55%)',
    cssForeground: 'hsl(0, 85%, 95%)',
  },
  amber: {
    oklch: 'oklch(82% 0.14 82)',
    oklchForeground: 'oklch(15% 0.03 82)',
    css: 'hsl(45, 100%, 55%)',
    cssForeground: 'hsl(45, 100%, 5%)',
  },
  violet: {
    oklch: 'oklch(68% 0.2 305)',
    oklchForeground: 'oklch(99% 0 0)',
    css: 'hsl(280, 95%, 60%)',
    cssForeground: 'hsl(280, 95%, 95%)',
  },
};

const ACCENT_DISPLAY: Record<Accent, string> = {
  purple: '#b87ce0',
  blue: '#5898f0',
  indigo: '#6366f1',
  teal: '#2dd4bf',
  green: '#4ade80',
  orange: '#fb923c',
  pink: '#f472b6',
  red: '#ef4444',
  amber: '#fbbf24',
  violet: '#a78bfa',
};

type BaseDef = { hue: number; label: string };

const BASES: Record<Base, BaseDef> = {
  neutral: { hue: 285.823, label: '#8c8c9e' },
  slate: { hue: 260, label: '#7878a0' },
  warm: { hue: 70, label: '#9e9e78' },
  olive: { hue: 120, label: '#8c9e8c' },
  sand: { hue: 45, label: '#9e948c' },
};

interface FontDef {
  family: string;
  googleFonts: string;
  category: 'sans' | 'mono';
  weights: string;
}

const FONTS: Record<Font, FontDef> = {
  'jetbrains-mono': {
    family: "'JetBrains Mono', monospace",
    googleFonts: 'JetBrains+Mono:wght@400;500;600;700;800',
    category: 'mono',
    weights: '400,500,600,700,800',
  },
  'inter': {
    family: "'Inter', system-ui, sans-serif",
    googleFonts: 'Inter:wght@400;500;600;700;800',
    category: 'sans',
    weights: '400,500,600,700,800',
  },
  'ibm-plex-mono': {
    family: "'IBM Plex Mono', monospace",
    googleFonts: 'IBM+Plex+Mono:wght@400;500;600;700',
    category: 'mono',
    weights: '400,500,600,700',
  },
  'fira-code': {
    family: "'Fira Code', monospace",
    googleFonts: 'Fira+Code:wght@400;500;600;700',
    category: 'mono',
    weights: '400,500,600,700',
  },
  'geist': {
    family: "'Geist', sans-serif",
    googleFonts: 'Geist:wght@400;500;600;700;800',
    category: 'sans',
    weights: '400,500,600,700,800',
  },
  'space-grotesk': {
    family: "'Space Grotesk', sans-serif",
    googleFonts: 'Space+Grotesk:wght@400;500;600;700',
    category: 'sans',
    weights: '400,500,600,700',
  },
  'source-code-pro': {
    family: "'Source Code Pro', monospace",
    googleFonts: 'Source+Code+Pro:wght@400;500;600;700;800',
    category: 'mono',
    weights: '400,500,600,700,800',
  },
  'dm-mono': {
    family: "'DM Mono', monospace",
    googleFonts: 'DM+Mono:wght@400;500',
    category: 'mono',
    weights: '400,500',
  },
  'jakarta-sans': {
    family: "'Plus Jakarta Sans', sans-serif",
    googleFonts: 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
    category: 'sans',
    weights: '400,500,600,700,800',
  },
  'onest': {
    family: "'Onest', sans-serif",
    googleFonts: 'Onest:wght@400;500;600;700;800',
    category: 'sans',
    weights: '400,500,600,700,800',
  },
};

const RADIUS: Record<Rad, string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
};

const STORAGE_KEY = 'nxe-theme';

const OLD_FONT_MAP: Record<string, Font> = {
  mono: 'jetbrains-mono',
  sans: 'inter',
};

function load(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, unknown> = JSON.parse(raw);
      const a = parsed.accent as string;
      const b = parsed.base as string;
      const f = parsed.font as string;
      const r = parsed.radius as string;
      return {
        accent: ACCENTS[a as Accent] ? (a as Accent) : 'purple',
        base: BASES[b as Base] ? (b as Base) : 'neutral',
        font: FONTS[f as Font]
          ? (f as Font)
          : OLD_FONT_MAP[f] && FONTS[OLD_FONT_MAP[f]]
            ? OLD_FONT_MAP[f]
            : 'jetbrains-mono',
        radius: RADIUS[r as Rad] ? (r as Rad) : 'md',
      };
    }
  } catch { /* ignore */ }
  return { accent: 'purple', base: 'neutral', font: 'jetbrains-mono', radius: 'md' };
}

const loadedFonts = new Set<string>();

function loadFont(font: Font) {
  const def = FONTS[font];
  if (loadedFonts.has(def.googleFonts)) return;
  loadedFonts.add(def.googleFonts);

  const existing = document.querySelector<HTMLLinkElement>('#nxe-font-link');
  if (existing) {
    const current = existing.href;
    const next = `https://fonts.googleapis.com/css2?family=${def.googleFonts}&display=swap`;
    if (current !== next) {
      existing.href = next;
    }
  }
}

function apply(settings: ThemeSettings) {
  const isDark = document.documentElement.classList.contains('dark');
  const root = document.documentElement.style;

  const accentDef = ACCENTS[settings.accent];
  const accent = isDark ? accentDef.oklch : accentDef.oklch;
  const accentFg = isDark ? accentDef.oklchForeground : accentDef.oklchForeground;

  root.setProperty('--accent', accent);
  root.setProperty('--accent-foreground', accentFg);
  root.setProperty('--focus', accent);
  root.setProperty('--link', accent);

  const baseDef = BASES[settings.base];
  const bgLight = `oklch(97.02% 0.0015 ${baseDef.hue})`;
  const bgDark = `oklch(12% 0.005 ${baseDef.hue})`;
  root.setProperty('--background', isDark ? bgDark : bgLight);

  const r = RADIUS[settings.radius];
  root.setProperty('--radius', r);
  root.setProperty('--field-radius', settings.radius === 'none' ? '0px' : `calc(${r} * 1.5)`);

  loadFont(settings.font);
  root.setProperty('--font-sans', FONTS[settings.font].family);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const accentKeys: Accent[] = Object.keys(ACCENTS) as Accent[];
const baseKeys: Base[] = Object.keys(BASES) as Base[];
const fontKeys: Font[] = Object.keys(FONTS) as Font[];
const radiusKeys: Rad[] = ['none', 'sm', 'md', 'lg'];

export function ThemeCustomizer() {
  const [settings, setSettings] = useState(load);
  useEffect(() => {
    apply(settings);
  }, [settings]);

  useEffect(() => {
    const mo = new MutationObserver(() => apply(settings));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, [settings]);

  useEffect(() => {
    if (!document.querySelector('#nxe-font-link')) {
      const link = document.createElement('link');
      link.id = 'nxe-font-link';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${FONTS[settings.font].googleFonts}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  const update = useCallback((partial: Partial<ThemeSettings>) => {
    setSettings(s => ({ ...s, ...partial }));
  }, []);

  return (
    <Popover>
      <PopoverTrigger>
        <Button size="sm" variant="tertiary" isIconOnly aria-label="theme settings">
          <Palette size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4">
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted block mb-2">accent</span>
            <div className="flex flex-wrap gap-1.5">
              {accentKeys.map(key => (
                <button
                  key={key}
                  onClick={() => update({ accent: key })}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all cursor-pointer',
                    settings.accent === key ? 'border-foreground scale-110 ring-1 ring-offset-1 ring-foreground/20' : 'border-transparent',
                  )}
                  style={{ background: ACCENT_DISPLAY[key] }}
                  aria-label={key}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted block mb-2">base</span>
            <div className="flex gap-2">
              {baseKeys.map(key => (
                <button
                  key={key}
                  onClick={() => update({ base: key })}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all cursor-pointer',
                    settings.base === key ? 'border-foreground scale-110' : 'border-transparent',
                  )}
                  style={{ background: BASES[key].label }}
                  aria-label={key}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted block mb-2">font</span>
            <div className="grid grid-cols-2 gap-1.5">
              {fontKeys.map(key => (
                <Button
                  key={key}
                  size="sm"
                  variant={settings.font === key ? 'primary' : 'secondary'}
                  onPress={() => update({ font: key })}
                  className="text-[10px] leading-tight h-7 px-2"
                >
                  {key.replace(/-/g, ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted block mb-2">radius</span>
            <div className="flex gap-2">
              {radiusKeys.map(key => (
                <Button
                  key={key}
                  size="sm"
                  variant={settings.radius === key ? 'primary' : 'secondary'}
                  onPress={() => update({ radius: key })}
                  className="flex-1 text-[11px]"
                >
                  {key === 'none' ? '0' : key}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
