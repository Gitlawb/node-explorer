import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, label, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Focus the panel unless a child claimed focus via autoFocus
    const id = requestAnimationFrame(() => {
      if (panelRef.current && !panelRef.current.contains(document.activeElement)) {
        panelRef.current.focus();
      }
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={cn(
          'mx-auto mt-[12vh] mb-8 w-[calc(100%-2rem)] max-w-[640px] border border-border bg-surface',
          'animate-fade-up motion-reduce:animate-none focus:outline-none',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
