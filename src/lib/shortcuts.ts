import { createContext } from 'react';

export type ModalId = 'palette' | 'finder' | 'cheatsheet' | null;

export type ShortcutHandler = (e: KeyboardEvent) => void;

export interface ShortcutsCtx {
  openModal: ModalId;
  setOpenModal: (m: ModalId) => void;
  /** Register a handler for e.key ('j', 'k', 't', '1'…'6', 'Backspace', 'y').
   *  Returns the unregister function. Last registration for a key wins. */
  register: (key: string, handler: ShortcutHandler) => () => void;
}

export const ShortcutsContext = createContext<ShortcutsCtx | null>(null);

export function isTypingTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
