import { useState } from 'react';
import { Button } from '@heroui/react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function CopyButton({ value, label = 'copy', size = 'sm', className }: CopyButtonProps) {
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
      variant={copied ? 'primary' : 'secondary'}
      size={size === 'md' ? 'md' : 'sm'}
      onPress={handleCopy}
      aria-label={`copy ${label}`}
      className={cn(
        'uppercase tracking-[0.15em]',
        copied ? 'text-accent' : '',
        className,
      )}
    >
      {copied ? 'copied' : label}
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </Button>
  );
}
