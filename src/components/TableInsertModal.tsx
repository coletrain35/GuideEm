import React, { useState } from 'react';
import { Table2 } from 'lucide-react';

interface TableInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number, withHeaderRow: boolean) => void;
}

export const TableInsertModal: React.FC<TableInsertModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  if (!isOpen) return null;

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  const handleInsert = () => {
    onInsert(rows, cols, withHeaderRow);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Table2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Insert Table</h3>
            <p className="text-xs text-slate-500">Configure rows, columns, and header</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-4">
          {/* Rows stepper */}
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Rows</label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setRows(r => clamp(r - 1, 1, 10))}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 text-lg font-medium transition-colors"
              >−</button>
              <span className="flex-1 text-center text-sm font-medium text-slate-800">{rows}</span>
              <button
                onClick={() => setRows(r => clamp(r + 1, 1, 10))}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 text-lg font-medium transition-colors"
              >+</button>
            </div>
          </div>

          {/* Cols stepper */}
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Columns</label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setCols(c => clamp(c - 1, 1, 8))}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 text-lg font-medium transition-colors"
              >−</button>
              <span className="flex-1 text-center text-sm font-medium text-slate-800">{cols}</span>
              <button
                onClick={() => setCols(c => clamp(c + 1, 1, 8))}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-600 text-lg font-medium transition-colors"
              >+</button>
            </div>
          </div>
        </div>

        {/* Header row toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={withHeaderRow}
            onChange={e => setWithHeaderRow(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          />
          <span className="text-sm text-slate-700">Include header row</span>
        </label>

        {/* Preview grid */}
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
          <div
            className="border border-slate-200 rounded-lg overflow-hidden"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: rows * cols }).map((_, i) => {
              const rowIndex = Math.floor(i / cols);
              const isHeader = withHeaderRow && rowIndex === 0;
              return (
                <div
                  key={i}
                  className={`h-6 border border-slate-100 ${isHeader ? 'bg-slate-100' : 'bg-white'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
};
