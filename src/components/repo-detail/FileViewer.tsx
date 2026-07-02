interface FileViewerProps {
  path: string;
  content: string | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

export function FileViewer({ path, content, loading, error, onBack }: FileViewerProps) {
  return (
    <div className="overflow-hidden border border-border">
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 h-10 border-b border-border bg-surface">
        <button
          onClick={onBack}
          className="micro-label hover:text-foreground transition-colors duration-100 flex-shrink-0 cursor-pointer
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
        >
          ← back
        </button>
        <span className="text-muted-foreground text-[12px] flex-shrink-0">/</span>
        <span className="font-mono text-[12px] sm:text-[13px] text-foreground truncate">{path}</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-14">
          <p className="text-[14px] text-muted-foreground animate-pulse">Loading…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-center py-14">
          <p className="text-[14px] text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && content !== null && (
        <pre className="p-4 sm:p-6 font-mono text-[12px] sm:text-[13px] text-foreground overflow-auto max-h-[65vh] leading-relaxed whitespace-pre">
          {content}
        </pre>
      )}
    </div>
  );
}
