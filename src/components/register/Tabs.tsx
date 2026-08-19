import {
  createContext,
  useContext,
  useId,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../lib/utils';

/**
 * Tabs, underline-indicator style.
 *
 * Arrow-key roving and correct tab/tabpanel wiring are kept from the kit this
 * replaces.
 */

interface TabsCtx {
  selected: string;
  select: (id: string) => void;
  baseId: string;
}

const Ctx = createContext<TabsCtx | null>(null);

function useTabs(): TabsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Tabs subcomponent used outside <Tabs>');
  return ctx;
}

interface TabsProps {
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  children: ReactNode;
}

export function Tabs({ selectedKey, onSelectionChange, children }: TabsProps) {
  const baseId = useId();
  return (
    <Ctx.Provider value={{ selected: selectedKey, select: onSelectionChange, baseId }}>
      {children}
    </Ctx.Provider>
  );
}

function ListContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border-b border-border', className)}>{children}</div>;
}

function List({ children, ...rest }: { children: ReactNode; 'aria-label'?: string }) {
  const listRef = useRef<HTMLDivElement>(null);

  // Roving arrow keys across the tab strip, wrapping at both ends.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    const i = tabs.findIndex(t => t === document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className="flex items-stretch gap-0 overflow-x-auto -mb-px"
      {...rest}
    >
      {children}
    </div>
  );
}

function Tab({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { selected, select, baseId } = useTabs();
  const active = selected === id;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${id}`}
      aria-selected={active}
      aria-controls={`${baseId}-panel-${id}`}
      tabIndex={active ? 0 : -1}
      onClick={() => select(id)}
      className={cn(
        'relative inline-flex items-baseline gap-1.5 whitespace-nowrap px-3 py-2',
        'text-[14px] transition-colors',
        active ? 'text-foreground' : 'text-muted hover:text-foreground',
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-2 right-2 -bottom-px h-[2px] bg-accent transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  );
}

/** Kept for call-site compatibility; the indicator is drawn by Tab itself. */
function Indicator() {
  return null;
}

function Panel({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { selected, baseId } = useTabs();
  if (selected !== id) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-tab-${id}`}
      tabIndex={0}
      className={cn(
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

Tabs.ListContainer = ListContainer;
Tabs.List = List;
Tabs.Tab = Tab;
Tabs.Indicator = Indicator;
Tabs.Panel = Panel;
