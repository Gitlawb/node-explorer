import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn } from '../../lib/utils';

/**
 * Controls.
 *
 * Rules and list hairlines are drawn square; controls are not. A control at
 * zero radius reads as a hard box, and a listing page puts many of them side by
 * side, so they take `--radius-control` — a full round, matching the search
 * field. Buttons stay frameless by default, and a border or a fill is reserved
 * for the rare control that must stand apart.
 *
 * `onPress` / `isDisabled` are accepted alongside `onClick` / `disabled` so
 * call sites migrating off the old kit keep working.
 */

const focus =
  'focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-1px]';

/* ── Input ────────────────────────────────────────────────────────────── */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: string;
}

export function Input({ className, variant: _variant, ...rest }: InputProps) {
  void _variant;
  return (
    <input
      {...rest}
      className={cn(
        'w-full h-9 px-0 text-[14px] bg-transparent text-foreground',
        'placeholder:text-muted border-0 border-b border-border',
        'transition-colors focus:border-foreground focus:outline-none',
        className,
      )}
    />
  );
}

/* ── Button ───────────────────────────────────────────────────────────── */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  children?: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  onPress?: () => void | Promise<void>;
  isDisabled?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | string;
  size?: 'sm' | 'md' | string;
  fullWidth?: boolean;
  isIconOnly?: boolean;
}

export function Button({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  fullWidth,
  isIconOnly,
  onClick,
  onPress,
  isDisabled,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const off = isDisabled ?? disabled;

  // A bordered control at list density is hundreds of frames on one page, which
  // is what made the surface feel boxy. The default is frameless: quiet text
  // that lifts on hover. A frame is reserved for `outline`, and a fill for the
  // one primary action on a view.
  const tones: Record<string, string> = {
    primary: 'bg-foreground text-background font-medium hover:opacity-90',
    secondary: 'text-muted hover:text-foreground hover:bg-surface-secondary',
    tertiary: 'text-muted hover:text-foreground',
    outline: 'text-foreground border border-border hover:border-foreground/40',
    danger: 'text-danger hover:bg-danger hover:text-background',
  };

  return (
    <button
      {...rest}
      type={type}
      disabled={off}
      onClick={e => {
        onClick?.(e);
        void onPress?.();
      }}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
        // Controls are fully round, matching the search field and the filter
        // track. At zero radius a control reads as a hard box, and this page
        // puts a lot of them next to each other.
        'rounded-[var(--radius-control)] transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        focus,
        isIconOnly
          ? 'h-8 w-8 p-0'
          : size === 'sm'
            ? 'h-7 px-2.5 text-[12px]'
            : 'h-8 px-3 text-[13px]',
        fullWidth && 'w-full',
        tones[variant] ?? tones.secondary,
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Select ───────────────────────────────────────────────────────────────
   Removed. The native control paints its option list as an operating-system
   popup that cannot take this page's colours or its zero-radius identity, and
   styling the closed control did nothing to the opened one. Use `Dropdown`
   (components/ui/Dropdown.tsx), which renders the list in the page. */

/* ── Kbd ──────────────────────────────────────────────────────────────── */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5',
        'rounded-[var(--radius-sm)] bg-surface-secondary font-mono text-[11px] text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

Kbd.Content = function KbdContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
};

/* ── Skeleton ─────────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block rounded-[var(--radius-sm)] bg-surface-secondary animate-pulse', className)}
    />
  );
}

/* ── Table ────────────────────────────────────────────────────────────── */
type Slot = { children?: ReactNode; className?: string };

export function Table({ children, className }: Slot) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}

Table.ScrollContainer = function ScrollContainer({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cn('w-full overflow-x-auto', className)}>{children}</div>;
};

Table.Content = function Content({ children, className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return <table {...rest} className={cn('w-full border-collapse text-left', className)}>{children}</table>;
};

Table.Header = function Header({ children, className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead {...rest} className={cn('border-b border-border', className)}>
      <tr>{children}</tr>
    </thead>
  );
};

Table.Body = function Body({ children, className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...rest} className={className}>{children}</tbody>;
};

Table.Row = function Row({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...rest}
      className={cn(
        'border-t border-separator first:border-t-0 hover:bg-surface-secondary transition-colors',
        className,
      )}
    >
      {children}
    </tr>
  );
};

Table.Column = function Column({ children, className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      scope="col"
      className={cn(
        'px-4 py-2 text-[12px] font-semibold text-muted whitespace-nowrap align-bottom',
        className,
      )}
    >
      {children}
    </th>
  );
};

Table.Cell = function Cell({ children, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...rest} className={cn('px-4 py-2 text-[13px] align-middle', className)}>{children}</td>;
};
