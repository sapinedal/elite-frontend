import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface PortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  /** Si se indica, la tecla Escape cierra el modal */
  onClose?: () => void;
}

export const Portal: React.FC<PortalProps> = ({ children, isOpen, onClose }) => {
  useEscapeToClose(isOpen, onClose);

  useEffect(() => {
    const layout = document.getElementById('root-layout');
    if (!layout) return;

    if (isOpen) {
      layout.classList.add('global-blur');
    } else {
      layout.classList.remove('global-blur');
    }

    return () => {
      layout.classList.remove('global-blur');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(children, document.body);
};
