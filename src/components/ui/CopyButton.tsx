import { useState } from 'react';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 7H1a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function CopyButton({ value, label = 'copy', size = 'sm' }: CopyButtonProps) {
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

  const sizeCls = size === 'md' ? 'h-11 px-4 text-[15px] gap-2' : 'h-[32px] px-3 text-[13px] gap-2';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center font-medium border rounded transition-all duration-150 cursor-pointer select-none ${sizeCls}`}
      style={{
        color: copied ? 'var(--color-foreground)' : 'var(--color-text-muted)',
        borderColor: copied ? 'var(--color-text-dim)' : 'var(--color-border)',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={e => {
        if (!copied) {
          e.currentTarget.style.color = 'var(--color-foreground)';
          e.currentTarget.style.borderColor = 'var(--color-text-dim)';
        }
      }}
      onMouseLeave={e => {
        if (!copied) {
          e.currentTarget.style.color = 'var(--color-text-muted)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'copied' : label}
    </button>
  );
}
