import React, { useState, useEffect, useCallback } from 'react';
import { History, RotateCcw, Trash2, Plus } from 'lucide-react';
import { Document, DocumentSnapshot, loadSnapshots, createSnapshot, deleteSnapshot } from '../utils/storage';
import { useDialog } from '../utils/useDialog';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoc: Document;
  onRestoreSnapshot: (snapshot: DocumentSnapshot) => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentDoc,
  onRestoreSnapshot,
}) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const drawerRef = useDialog<HTMLDivElement>(isOpen, onClose);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadSnapshots(currentDoc.id);
      setSnapshots(list);
    } finally {
      setLoading(false);
    }
  }, [currentDoc.id]);

  useEffect(() => {
    if (isOpen) {
      void refresh();
    }
  }, [isOpen, refresh]);

  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const checkpointLabel = label.trim() || 'Manual checkpoint';
    await createSnapshot(currentDoc, checkpointLabel, 0);
    setLabel('');
    await refresh();
  };

  const handleDeleteSnapshot = async (snapId: string) => {
    await deleteSnapshot(currentDoc.id, snapId);
    await refresh();
  };

  const formatTimestamp = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 w-full sm:w-96 h-full bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-600" aria-hidden />
            <h2 id="version-history-title" className="text-lg font-semibold text-slate-900">Version History</h2>
          </div>
          <button
            id="close-history-drawer-btn"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close version history"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        <form onSubmit={handleCreateCheckpoint} className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
          <label htmlFor="snapshot-label-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Save Checkpoint
          </label>
          <div className="flex gap-2">
            <input
              id="snapshot-label-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Checkpoint label (e.g. Before refactor)"
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              id="create-snapshot-btn"
              type="submit"
              className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus size={14} aria-hidden />
              Save Checkpoint
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Loading snapshots…</p>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-slate-500 font-medium">No snapshots saved for this guide yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Auto-snapshots save periodically during editing, or create a manual checkpoint above.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {snap.label || 'Auto-snapshot'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatTimestamp(snap.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onRestoreSnapshot(snap)}
                      className="restore-snapshot-btn inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      title="Restore this version"
                    >
                      <RotateCcw size={12} aria-hidden />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSnapshot(snap.id)}
                      className="delete-snapshot-btn p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete snapshot"
                      aria-label={`Delete snapshot ${snap.label || 'Auto-snapshot'}`}
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {snap.title || 'Untitled Guide'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
