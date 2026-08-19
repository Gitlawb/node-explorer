import { Search } from 'lucide-react';
import { Input } from './controls';
import { cn } from '../../lib/utils';

interface SearchFieldProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Accessible name; the field carries its icon instead of a visible label. */
  label: string;
  className?: string;
}

/**
 * The search field used on every listing page.
 *
 * One shape, defined once. Each page previously rolled its own — a stacked
 * caption above a square input — which meant four slightly different search
 * bars and four places to fix anything.
 */
export function SearchField({
  id,
  value,
  onChange,
  placeholder,
  label,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn('relative min-w-[240px]', className)}>
      <Search
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
      />
      <Input
        id={id}
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        className="h-10 w-full rounded-full pl-9 pr-3"
      />
    </div>
  );
}
