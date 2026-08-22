import React, { useState, useRef, useEffect } from 'react';
import { Document } from '../utils/storage';
import { Plus, FileText, Trash2, X, Copy, Search, Tag, Hash, MoreVertical } from 'lucide-react';

interface SidebarProps {
  documents: Document[];
  currentDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onDeleteDoc: (id: string, e: React.MouseEvent) => void;
  onDuplicateDoc: (id: string, e: React.MouseEvent) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onRenameDoc?: (id: string, newTitle: string) => void;
  onClose?: () => void;
}

// Deterministic color per tag label
const TAG_COLORS = [
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
];

function tagColor(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) & 0xffff;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents, currentDocId, onSelectDoc, onCreateDoc, onDeleteDoc, onDuplicateDoc, onTagsChange, onRenameDoc, onClose
}) => {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingTagsFor, setEditingTagsFor] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingDocId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingDocId]);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!activeMenuDocId) return;
    const handler = () => setActiveMenuDocId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [activeMenuDocId]);

  const sortedDocs = [...documents].sort((a, b) => b.lastEdited - a.lastEdited);

  const allTags = Array.from(
    new Set(sortedDocs.flatMap(d => d.tags || []))
  ).sort();

  const filteredDocs = sortedDocs.filter(d => {
    const matchesQuery = !query.trim() || (d.title || 'Untitled Guide').toLowerCase().includes(query.toLowerCase());
    const matchesTag = !activeTag || (d.tags || []).includes(activeTag);
    return matchesQuery && matchesTag;
  });

  const addTag = (docId: string, docTags: string[]) => {
    const label = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!label || docTags.includes(label)) { setTagInput(''); return; }
    onTagsChange?.(docId, [...docTags, label]);
    setTagInput('');
  };

  const removeTag = (docId: string, docTags: string[], tag: string) => {
    onTagsChange?.(docId, docTags.filter(t => t !== tag));
    if (activeTag === tag && !sortedDocs.some(d => d.id !== docId && (d.tags || []).includes(tag))) {
      setActiveTag(null);
    }
  };

  const startRenaming = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingDocId(doc.id);
    setRenameValue(doc.title || 'Untitled Guide');
    setActiveMenuDocId(null);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameDoc?.(id, renameValue.trim());
    }
    setRenamingDocId(null);
    setRenameValue('');
  };

  return (
    <aside className="flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800 flex-shrink-0 select-none">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-white flex items-center gap-2 text-sm">
            <FileText size={18} className="text-blue-400" />
            GuideEm
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCreateDoc}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="New Document"
              aria-label="New Document"
            >
              <Plus size={18} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors md:hidden"
                title="Close Sidebar"
                aria-label="Close Sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Input */}
      {sortedDocs.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-800">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="w-full bg-slate-800 text-slate-300 placeholder-slate-500 text-xs rounded-lg pl-7 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-800">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Hash size={10} /> Tags
          </p>
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  activeTag === tag
                    ? tagColor(tag) + ' font-semibold'
                    : 'text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-500'
                }`}
              >
                {tag}
              </button>
            ))}
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="text-[10px] px-2 py-0.5 rounded-full text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700 transition-all"
              >
                clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1" role="list">
        {filteredDocs.length === 0 ? (
          <p className="text-xs text-center text-slate-500 mt-4">
            {query || activeTag ? 'No matches found.' : 'No documents yet.'}
          </p>
        ) : (
          filteredDocs.map(doc => {
            const docTags = doc.tags || [];
            const isEditingTags = editingTagsFor === doc.id;
            const isRenaming = renamingDocId === doc.id;
            const isSelected = currentDocId === doc.id;

            return (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                className={`group relative rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-200'
                }`}
                onClick={() => !isRenaming && onSelectDoc(doc.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming) {
                    onSelectDoc(doc.id);
                  }
                }}
              >
                {/* Main row */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex flex-col truncate pr-2 min-w-0 flex-1">
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(doc.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitRename(doc.id);
                          } else if (e.key === 'Escape') {
                            setRenamingDocId(null);
                          }
                          e.stopPropagation();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium bg-slate-800 text-white rounded px-1.5 py-0.5 outline-none border border-blue-500"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => startRenaming(doc, e)}
                        title="Double-click to rename"
                        className="truncate text-sm font-medium"
                      >
                        {doc.title || 'Untitled Guide'}
                      </span>
                    )}
                    <span className="text-[11px] opacity-40 mt-0.5">
                      {new Date(doc.lastEdited).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Desktop Hover Actions + Mobile Overflow Menu */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <div className="hidden sm:flex opacity-0 group-hover:opacity-100 items-center gap-0.5 transition-opacity">
                      {onTagsChange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTagsFor(isEditingTags ? null : doc.id);
                            setTagInput('');
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            isEditingTags || docTags.length > 0
                              ? 'text-blue-400 hover:bg-slate-700'
                              : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Manage tags"
                        >
                          <Tag size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => onDuplicateDoc(doc.id, e)}
                        className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        title="Duplicate Document"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onDeleteDoc(doc.id, e)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Mobile 3-dot menu trigger */}
                    <div className="sm:hidden relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                        aria-label="Document actions"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuDocId === doc.id && (
                        <div
                          className="absolute right-0 top-full mt-1 z-50 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => startRenaming(doc, e)}
                            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-700"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              onDuplicateDoc(doc.id, e);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-700"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              setEditingTagsFor(isEditingTags ? null : doc.id);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-700"
                          >
                            Tags
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              onDeleteDoc(doc.id, e);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tag chips */}
                {(docTags.length > 0 || isEditingTags) && (
                  <div className="px-3 pb-2" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1 items-center">
                      {docTags.map(tag => (
                        <span key={tag} className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border ${tagColor(tag)}`}>
                          {tag}
                          {isEditingTags && (
                            <button
                              type="button"
                              onClick={() => removeTag(doc.id, docTags, tag)}
                              className="ml-0.5 opacity-70 hover:opacity-100"
                            >
                              <X size={9} />
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditingTags && (
                        <input
                          type="text"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              addTag(doc.id, docTags);
                            }
                            if (e.key === 'Escape') setEditingTagsFor(null);
                          }}
                          placeholder="add tag…"
                          className="text-[10px] bg-transparent text-slate-400 placeholder-slate-600 outline-none w-16 min-w-0"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
