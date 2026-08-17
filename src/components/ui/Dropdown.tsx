import * as SelectPrimitive from '@radix-ui/react-select';
import { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * A single-choice menu.
 *
 * Built on Radix Select. A native `<select>` paints its option list as an
 * operating-system popup that lives outside the document: it cannot take the
 * page's colours, its radius, or its type, and on Windows it draws as a hard
 * grey box. Radix renders the list into a portal in the page instead, so it is
 * styled here, while keeping the keyboard and screen-reader behaviour the
 * native control had — typeahead, arrow keys, Home/End, Escape to cancel,
 * focus returned to the trigger, and collision-aware placement.
 *
 * The trigger is a full-round pill, matching the search field.
 */
export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Visible caption printed before the control. */
  label: string;
  id?: string;
  className?: string;
  /** Align the menu against the trigger's start or end edge. */
  align?: 'start' | 'end';
}

export function Dropdown<T extends string>({
  options,
  value,
  onChange,
  label,
  id,
  className,
  align = 'start',
}: DropdownProps<T>) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const labelId = `${controlId}-label`;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span id={labelId} className="text-[12px] text-muted whitespace-nowrap">
        {label}
      </span>

      <SelectPrimitive.Root value={value} onValueChange={v => onChange(v as T)}>
        <SelectPrimitive.Trigger
          id={controlId}
          aria-labelledby={`${labelId} ${controlId}`}
          className={cn(
            'group inline-flex items-center gap-1.5 h-8 pl-3.5 pr-3 text-[13px] whitespace-nowrap',
            'rounded-[var(--radius-control)] border border-border bg-transparent text-foreground',
            'cursor-pointer transition-colors hover:border-foreground/45 hover:bg-surface-secondary',
            'data-[state=open]:border-foreground/60 data-[state=open]:bg-surface-secondary',
            'focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          )}
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon asChild>
            <Chevron
              aria-hidden="true"
              className="h-3.5 w-3.5 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
              'rounded-[var(--radius)] border border-border bg-background p-1',
              'shadow-[0_12px_32px_-8px_rgba(0,0,0,0.28)]',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
            )}
          >
            <SelectPrimitive.Viewport className="max-h-72">
              {options.map(option => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center gap-2 py-1.5 pl-2 pr-3',
                    'rounded-[var(--radius-sm)] text-[13px] text-foreground whitespace-nowrap outline-none',
                    'data-[highlighted]:bg-foreground data-[highlighted]:text-background',
                  )}
                >
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check aria-hidden="true" className="h-3 w-3" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

function Chevron({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...rest}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function Check({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...rest}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  );
}
