import type { ReactNode } from 'react';
import {
  Modal as HModal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalBody,
  useOverlayState,
} from '@heroui/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover' | 'full';
}

export function Modal({ open, onClose, label, children, className, size = 'md' }: ModalProps) {
  const state = useOverlayState({ isOpen: open, onOpenChange: onClose });

  return (
    <HModal state={state}>
      <ModalBackdrop />
      <ModalContainer size={size} placement="center" scroll="inside">
        <ModalDialog aria-label={label} className={className}>
          <ModalBody>{children}</ModalBody>
        </ModalDialog>
      </ModalContainer>
    </HModal>
  );
}
