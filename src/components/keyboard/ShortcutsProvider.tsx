import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { ShortcutsContext, isTypingTarget, type ModalId, type ShortcutHandler } from '../../lib/shortcuts';
import { CommandPalette } from './CommandPalette';
import { KeyboardCheatsheet } from './KeyboardCheatsheet';

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [openModal, setOpenModal] = useState<ModalId>(null);
  const registryRef = useRef(new Map<string, ShortcutHandler>());

  const register = useCallback((key: string, handler: ShortcutHandler) => {
    registryRef.current.set(key, handler);
    return () => {
      if (registryRef.current.get(key) === handler) registryRef.current.delete(key);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Palette toggle works everywhere, even while typing
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenModal(m => (m === 'palette' ? null : 'palette'));
        return;
      }
      // Open modals own their keys (Modal handles Escape)
      if (openModal !== null) return;
      if (isTypingTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        setOpenModal('cheatsheet');
        return;
      }
      registryRef.current.get(e.key)?.(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openModal]);

  const ctx = useMemo(
    () => ({ openModal, setOpenModal, register }),
    [openModal, register],
  );

  return (
    <ShortcutsContext.Provider value={ctx}>
      {children}
      <CommandPalette open={openModal === 'palette'} onClose={() => setOpenModal(null)} />
      <KeyboardCheatsheet open={openModal === 'cheatsheet'} onClose={() => setOpenModal(null)} />
    </ShortcutsContext.Provider>
  );
}
