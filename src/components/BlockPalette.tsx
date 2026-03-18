import { useState, useRef } from 'react';
import { BLOCK_ITEMS, BLOCK_CATEGORIES, type BlockItem } from '../utils/blockItems';
import { Search, X, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import type { Editor } from '@tiptap/core';

interface BlockPaletteProps {
  editor: Editor;
  onClose: () => void;
}

export const BlockPalette = ({ editor, onClose }: BlockPaletteProps) => {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? BLOCK_ITEMS.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()))
      )
    : BLOCK_ITEMS;

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: BlockItem) => {
    e.dataTransfer.setData('application/x-block-palette', item.id);
    e.dataTransfer.effectAllowed = 'copy';

    // Create a small drag ghost
    const ghost = document.createElement('div');
    ghost.textContent = item.label;
    ghost.style.cssText = 'position:absolute;top:-999px;padding:6px 12px;background:#3b82f6;color:#fff;border-radius:6px;font-size:13px;font-weight:500;white-space:nowrap;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  };

  const handleClick = (item: BlockItem) => {
    item.action(editor);
  };

  return (
    <div className="w-60 flex-shrink-0 border-r border-slate-200 bg-slate-50/80 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blocks</span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
          title="Close palette"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter blocks…"
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {BLOCK_CATEGORIES.map(category => {
          const items = filtered.filter(i => i.category === category);
          if (items.length === 0) return null;
          const collapsed = collapsedCategories.has(category);

          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1 w-full px-1.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                {category}
                <span className="ml-auto text-slate-300 font-normal normal-case">{items.length}</span>
              </button>

              {!collapsed && (
                <div className="space-y-0.5">
                  {items.map(item => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        draggable="true"
                        onDragStart={e => handleDragStart(e, item)}
                        onClick={() => handleClick(item)}
                        className="group flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all active:cursor-grabbing"
                        title={`${item.label} — ${item.description}\nDrag to insert or click`}
                      >
                        <GripVertical size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                        <div className="p-1.5 rounded-md bg-white border border-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50 transition-colors flex-shrink-0">
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate leading-tight">{item.label}</div>
                          <div className="text-[11px] text-slate-400 truncate leading-tight">{item.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400">
            No blocks match "{search}"
          </div>
        )}
      </div>
    </div>
  );
};
