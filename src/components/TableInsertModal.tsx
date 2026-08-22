import React, { useState } from 'react';
import { Table2, X } from 'lucide-react';
import { useDialog } from '../utils/useDialog';

interface TableInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number, withHeaderRow: boolean) => void;
}

export const TableInsertModal: React.FC<TableInsertModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  const handleInsert = () => {
    onInsert(rows, cols, withHeaderRow);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-insert-title"
        aria-describedby="table-insert-desc"
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Table2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 id="table-insert-title" className="font-semibold text-slate-900 text-base">Insert Table</h3>
            <p id="table-insert-desc" className="text-xs text-slate-500">Configure table grid dimensions and headers</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-4">
          {/* Rows stepper */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Rows</label>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <button
                type="button"
                disabled={rows <= 1}
                onClick={() => setRows(r => clamp(r - 1, 1, 10))}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 text-base font-bold transition-colors"
                aria-label="Decrease row count"
              >−</button>
              <span className="flex-1 text-center text-sm font-semibold text-slate-800 tabular-nums">{rows}</span>
              <button
                type="button"
                disabled={rows >= 10}
                onClick={() => setRows(r => clamp(r + 1, 1, 10))}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 text-base font-bold transition-colors"
                aria-label="Increase row count"
              >+</button>
            </div>
          </div>

          {/* Cols stepper */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Columns</label>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <button
                type="button"
                disabled={cols <= 1}
                onClick={() => setCols(c => clamp(c - 1, 1, 8))}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 text-base font-bold transition-colors"
                aria-label="Decrease column count"
              >−</button>
              <span className="flex-1 text-center text-sm font-semibold text-slate-800 tabular-nums">{cols}</span>
              <button
                type="button"
                disabled={cols >= 8}
                onClick={() => setCols(c => clamp(c + 1, 1, 8))}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 text-base font-bold transition-colors"
                aria-label="Increase column count"
              >+</button>
            </div>
          </div>
        </div>

        {/* Header row toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer mb-5 select-none">
          <input
            type="checkbox"
            checked={withHeaderRow}
            onChange={e => setWithHeaderRow(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-medium text-slate-700">Include header row</span>
        </label>

        {/* Preview grid */}
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Live Grid Preview</p>
          <div
            className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-36 overflow-y-auto"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: rows * cols }).map((_, i) => {
              const rowIndex = Math.floor(i / cols);
              const isHeader = withHeaderRow && rowIndex === 0;
              return (
                <div
                  key={i}
                  className={`h-5 border border-slate-100 ${isHeader ? 'bg-slate-100' : 'bg-white'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
};
