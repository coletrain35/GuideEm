import { useEffect, useRef } from 'react';

/**
 * Focus-trap + Escape + focus-restore primitive for modal dialogs.
 *
 * Usage:
 *   const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
 *   return isOpen ? <div ref={dialogRef} role="dialog" aria-modal="true">…</div> : null;
 *
 * The hook:
 *   1. Remembers the element that had focus when the dialog opened, and
 *      restores focus to it when the dialog closes.
 *   2. Focuses the first focusable element inside the dialog on open.
 *   3. Closes on Escape.
 *   4. Traps Tab / Shift+Tab within the dialog so keyboard focus can't
 *      escape into the editor underneath.
 */
export const useDialog = <T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
) => {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember the trigger so we can restore focus on close.
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

    // Defer the initial focus to the next frame so the dialog's children
    // have actually mounted.
    const focusInitial = () => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        // No focusable child — focus the container itself so Escape / Tab
        // keys still reach us.
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };
    const raf = requestAnimationFrame(focusInitial);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;
        const focusables = getFocusableElements(container);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !container.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !container.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore focus to whatever opened the dialog.
      const trigger = previouslyFocusedRef.current;
      if (trigger && typeof trigger.focus === 'function') {
        // Slight defer so the unmounted siblings don't steal focus first.
        setTimeout(() => {
          if (document.body.contains(trigger)) trigger.focus();
        }, 0);
      }
    };
  }, [isOpen, onClose]);

  return containerRef;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const getFocusableElements = (root: HTMLElement): HTMLElement[] => {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
  );
};
