import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Search, Sparkles, X, Plus } from 'lucide-react';
import {
  BLOCK_ITEMS,
  BLOCK_CATEGORIES,
  insertBlock,
  insertBlockAction,
  type BlockCategory,
  type BlockItem,
  type BlockPreset,
} from '../utils/blockItems';
import { BlockPreviewGraphic } from './BlockPreview';
import { useDialog } from '../utils/useDialog';

interface BlockGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  initialCategory?: BlockCategory | 'All';
  initialBlockId?: string | null;
}

export const BlockGalleryModal: React.FC<BlockGalleryModalProps> = ({
  isOpen,
  onClose,
  editor,
  initialCategory = 'All',
  initialBlockId = null,
}) => {
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'All'>(initialCategory);
  const [search, setSearch] = useState('');
  const [presetsOnly, setPresetsOnly] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveCategory(initialCategory || 'All');
    setSearch('');
    setPresetsOnly(false);
    setHighlightedId(initialBlockId ?? null);

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      if (initialBlockId) {
        const el = cardRefs.current.get(initialBlockId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, initialCategory, initialBlockId]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BLOCK_ITEMS.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (presetsOnly && (!item.presets || item.presets.length === 0)) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.details && item.details.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        (item.highlights?.some((h) => h.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [activeCategory, search, presetsOnly]);

  if (!isOpen) return null;

  const handleInsertDefault = (item: BlockItem) => {
    insertBlock(editor, item);
    onClose();
    window.setTimeout(() => editor.view.focus(), 20);
  };

  const handleInsertPreset = (preset: BlockPreset) => {
    insertBlockAction(editor, preset.action);
    onClose();
    window.setTimeout(() => editor.view.focus(), 20);
  };

  const categoryCounts = BLOCK_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = BLOCK_ITEMS.filter((i) => i.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-gallery-title"
        aria-describedby="block-gallery-description"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles size={15} aria-hidden />
              </div>
              <h2 id="block-gallery-title" className="text-lg font-bold text-slate-900">
                Block Gallery
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-xs font-semibold tabular-nums">
                {BLOCK_ITEMS.length} blocks
              </span>
            </div>
            <p id="block-gallery-description" className="text-xs text-slate-500 mt-0.5">
              Preview layouts and insert polished blocks or starter presets directly into your guide.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, layout, or use case…"
                aria-label="Search blocks in gallery"
                className="w-full pl-8 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              aria-label="Close block gallery"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white shrink-0">
          <button
            type="button"
            onClick={() => { setActiveCategory('All'); setHighlightedId(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activeCategory === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({BLOCK_ITEMS.length})
          </button>

          {BLOCK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setActiveCategory(cat); setHighlightedId(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}

          <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

          <button
            type="button"
            onClick={() => setPresetsOnly((v) => !v)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap border ${
              presetsOnly
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            aria-pressed={presetsOnly}
          >
            <Sparkles size={12} aria-hidden />
            <span>Has Presets</span>
          </button>
        </div>

        {/* Visual Card Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isHighlighted = highlightedId === item.id;
                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(item.id, el);
                      else cardRefs.current.delete(item.id);
                    }}
                    className={`group flex flex-col bg-white rounded-2xl border overflow-hidden transition-all duration-150 hover:shadow-md hover:border-blue-300 ${
                      isHighlighted
                        ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Preview Stage */}
                    <button
                      type="button"
                      onClick={() => handleInsertDefault(item)}
                      className="w-full p-3 bg-slate-50/70 border-b border-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      title={`Insert ${item.label}`}
                    >
                      <div className="transition-transform duration-150 group-hover:scale-[1.015]">
                        <BlockPreviewGraphic blockId={item.id} size="lg" />
                      </div>
                    </button>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleInsertDefault(item)}
                            className="flex items-center gap-2 text-left group/title focus:outline-none"
                          >
                            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                              <Icon size={14} aria-hidden />
                            </div>
                            <span className="font-semibold text-sm text-slate-900 group-hover/title:text-blue-700 transition-colors">
                              {item.label}
                            </span>
                          </button>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 shrink-0">
                            {item.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.details || item.description}
                        </p>

                        {item.highlights && item.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.highlights.map((h) => (
                              <span
                                key={h}
                                className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/80 text-[10px] font-medium text-slate-600"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Presets & Primary Insert */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        {item.presets && item.presets.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                              Starter Presets
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.presets.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleInsertPreset(preset)}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] font-medium text-slate-700 hover:text-blue-700 transition-colors"
                                >
                                  {preset.accentColor && (
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: preset.accentColor }}
                                    />
                                  )}
                                  <span>{preset.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInsertDefault(item)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
                        >
                          <Plus size={13} aria-hidden />
                          <span>Insert {item.label}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-slate-600">
                No blocks match {search ? `"${search}"` : 'this filter'}
              </p>
              <button
                type="button"
                onClick={() => { setSearch(''); setActiveCategory('All'); setPresetsOnly(false); }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
