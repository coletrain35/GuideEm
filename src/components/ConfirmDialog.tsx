import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useDialog } from '../utils/useDialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5 mb-6">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            variant === 'danger' ? 'bg-rose-50 text-rose-600' :
            variant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {variant === 'danger' && <AlertTriangle size={20} aria-hidden />}
            {variant === 'warning' && <AlertCircle size={20} aria-hidden />}
            {variant === 'info' && <Info size={20} aria-hidden />}
          </div>
          <div className="min-w-0 pr-4">
            <h3 id="confirm-dialog-title" className="font-semibold text-slate-900 mb-1 text-base">{title}</h3>
            <p id="confirm-dialog-message" className="text-xs text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-xs ${
              variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' :
              variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
