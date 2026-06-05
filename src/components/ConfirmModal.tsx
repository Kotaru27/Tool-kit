import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpecialText from './SpecialText';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isAlert = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-main/80 backdrop-blur-md"
            onClick={isAlert ? onConfirm : onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[var(--color-bg-panel)] border border-[rgba(255,255,255,0.1)] rounded-[var(--radius-app)] p-8 w-[90vw] max-w-[400px] flex-none relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          >
            <h3 className="text-2xl font-medium text-text-main mb-4 tracking-tighter">
              <SpecialText speed={30}>{title}</SpecialText>
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed font-mono">
              {message}
            </p>
            <div className="flex gap-4 justify-end">
              {!isAlert && (
                <button
                  className="liquid-btn"
                  onClick={onCancel}
                >
                  {cancelText}
                </button>
              )}
              <button
                className={`liquid-btn ${isAlert ? 'active-mode' : 'danger-btn'}`}
                onClick={onConfirm}
              >
                {isAlert ? 'OK' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

