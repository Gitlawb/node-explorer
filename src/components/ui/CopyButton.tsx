import { useState } from 'react';
import { cn } from '../../lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 7H1a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function CopyButton({ value, label = 'copy', size = 'sm', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`copy ${label}`}
      className={cn(
        'inline-flex items-center font-medium uppercase tracking-[0.15em] border rounded-[2px]',
        'transition-colors duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm',
        size === 'md' ? 'h-9 px-4 text-[11px] gap-2' : 'h-7 px-2.5 text-[10px] gap-1.5',
        copied
          ? 'border-warm/60 text-warm'
          : 'border-border text-muted-foreground hover:border-dim hover:text-foreground',
        className,
      )}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'copied' : label}
    </button>
  );
}
