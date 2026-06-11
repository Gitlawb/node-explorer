import { ThemeToggle } from '../ui/ThemeToggle';

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border/60 backdrop-blur-sm bg-background/95">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 sm:px-6">

        {/* Left: branding */}
        <div className="flex flex-col shrink-0">
          <span className="text-sm font-semibold text-foreground leading-tight">Node Explorer</span>
          <span className="text-xs text-muted-foreground leading-tight max-sm:hidden">Browse live repositories</span>
        </div>

        <div className="flex-1" />

        {/* Right: theme toggle + avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Node identity"
          >
            NE
          </button>
        </div>

      </div>
    </header>
  );
}
