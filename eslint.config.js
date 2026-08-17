import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.vercel', '.playwright-cli']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui primitives export variant helpers alongside components by design
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Vendored registry components, added verbatim via `shadcn add` from the
    // Magic UI and Aceternity registries. They are third-party sources, not
    // ours to rewrite: they predate the React 19 compiler rules this project
    // lints with (Math.random() during render for decorative jitter,
    // setState inside effects to drive typing sequences). Scoped off here so
    // the rules stay strict for code we actually author. Re-running
    // `shadcn add` overwrites these files, so local fixes would not survive.
    files: [
      'src/components/ui/animated-beam.tsx',
      'src/components/ui/icon-cloud.tsx',
      'src/components/ui/globe.tsx',
      'src/components/ui/scroll-progress.tsx',
      'src/components/ui/animated-circular-progress-bar.tsx',
      'src/components/ui/orbiting-circles.tsx',
      'src/components/ui/animated-list.tsx',
      'src/components/ui/confetti.tsx',
      'src/components/ui/ripple-button.tsx',
      'src/components/ui/rainbow-button.tsx',
      'src/components/ui/pulsating-button.tsx',
      'src/components/ui/shiny-button.tsx',
      'src/components/ui/shimmer-button.tsx',
      'src/components/ui/ripple.tsx',
      'src/components/ui/marquee.tsx',
      'src/components/ui/magic-card.tsx',
      'src/components/ui/interactive-hover-button.tsx',
      'src/components/ui/aurora-text.tsx',
      'src/components/ui/animated-gradient-text.tsx',
      'src/components/ui/animated-theme-toggler.tsx',
      'src/components/ui/animated-shiny-text.tsx',
      'src/components/ui/bento-grid.tsx',
      'src/components/ui/blur-fade.tsx',
      'src/components/ui/border-beam.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/dot-pattern.tsx',
      'src/components/ui/file-tree.tsx',
      'src/components/ui/grid-pattern.tsx',
      'src/components/ui/number-ticker.tsx',
      'src/components/ui/scroll-area.tsx',
      'src/components/ui/terminal.tsx',
      'src/components/ui/tracing-beam.tsx',
    ],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Vercel Functions run on Node and intentionally export HTTP handlers.
    files: ['api/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
