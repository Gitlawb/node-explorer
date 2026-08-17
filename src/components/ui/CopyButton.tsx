import { useState } from 'react';
import { Button } from '../register/controls';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Copy-to-clipboard. Sentence case: this renders once per row on the listing
 * pages, so an uppercase tracked label put fifty shouting chips on a page whose
 * whole job is scanning.
 */
export function CopyButton({ value, label = 'Copy', size = 'sm', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  return (
    <Button
      variant="tertiary"
      size={size === 'md' ? 'md' : 'sm'}
      onPress={handleCopy}
      aria-label={`copy ${label}`}
      className={cn(copied && 'text-success', className)}
    >
      {copied ? 'Copied' : label}
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </Button>
  );
}
