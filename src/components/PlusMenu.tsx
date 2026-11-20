import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { Plus, Search, Sparkles, X } from 'lucide-react';
import {
  BLOCK_ITEMS,
  BLOCK_CATEGORIES,
  insertBlock,
  insertBlockAction,
  openBlockGallery,
  type BlockItem,
  type BlockPreset,
} from '../utils/blockItems';
import { BlockFlyoutCard } from './BlockPreview';

interface PlusMenuProps {
  editor: Editor;
}

export const PlusMenu = ({ editor }: PlusMenuProps) => {
  const [visible, setVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [btnPos, setBtnPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [hoveredItem, setHoveredItem] = useState<BlockItem>(BLOCK_ITEMS[0]);
  const [filter, setFilter] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const [flipUp, setFlipUp] = useState(false);

  const updatePosition = useCallback(() => {
    if (!editor || editor.isDestroyed) return;

    const { selection } = editor.state;
    const { $from } = selection;

    // Only show on empty paragraphs
    if (!selection.empty || $from.parent.content.size !== 0 || $from.parent.type.name !== 'paragraph') {
      setVisible(false);
      setPopoverOpen(false);
      return;
    }

    try {
      const domInfo = editor.view.domAtPos($from.pos);
      const node = domInfo.node instanceof HTMLElement ? domInfo.node : domInfo.node.parentElement;
      if (!node) { setVisible(false); return; }

      const rect = node.getBoundingClientRect();
      const editorRect = editor.view.dom.getBoundingClientRect();
      if (rect.height === 0 || rect.top < 48 || rect.top > window.innerHeight - 24) {
        setVisible(false);
        return;
      }

      // Position to the left of the editor content, clear of the drag handle (20px wide at editorLeft - 20)
      const isMobile = window.innerWidth < 640;
      const top = rect.top;
      const left = isMobile ? editorRect.left - 28 : editorRect.left - 56;

      setBtnPos({ top, left });
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', updatePosition);
    editor.on('transaction', updatePosition);
    const scrollTarget = editor.view.dom.closest('main') ?? window;
    scrollTarget.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('transaction', updatePosition);
      scrollTarget.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, updatePosition]);

  // Close popover on click outside
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  // Close on Escape
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [popoverOpen]);

  // Flip logic + responsive positioning
  useEffect(() => {
    if (!popoverOpen || !btnRef.current) return;
    const btnRect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - btnRect.bottom;
    setFlipUp(spaceBelow < 420);
    setFilter('');
    setHoveredItem(BLOCK_ITEMS[0]);
    const t = window.setTimeout(() => filterInputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [popoverOpen]);

  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return BLOCK_ITEMS;
    const qCompact = q.replace(/\s+/g, '');
    return BLOCK_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      item.label.toLowerCase().replace(/\s+/g, '').includes(qCompact) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [filter]);

  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some((it) => it.id === hoveredItem?.id)) {
      setHoveredItem(filteredItems[0]);
    }
  }, [filteredItems, hoveredItem]);

  // On phones the popover switches to a full-width bottom sheet.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const handleItemClick = (item: BlockItem) => {
    setPopoverOpen(false);
    insertBlock(editor, item);
  };

  const handlePresetClick = (_item: BlockItem, preset: BlockPreset) => {
    setPopoverOpen(false);
    insertBlockAction(editor, preset.action);
  };

  const handleOpenGallery = (item?: BlockItem) => {
    setPopoverOpen(false);
    openBlockGallery(item ? { blockId: item.id, category: item.category } : undefined);
  };

  if (!visible) return null;

  // Group items by category
  const grouped = BLOCK_CATEGORIES.map((cat) => ({
    category: cat,
    items: filteredItems.filter((it) => it.category === cat),
  })).filter((g) => g.items.length > 0);

  const desktopLeft = typeof window !== 'undefined'
    ? Math.max(12, Math.min(btnPos.left, window.innerWidth - 556))
    : btnPos.left;

  return (
    <>
      {/* + Button */}
      <button
        ref={btnRef}
        onClick={() => setPopoverOpen((v) => !v)}
        className="fixed z-30 flex items-center justify-center w-7 h-7 rounded-full border border-slate-300 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-400 shadow-sm transition-colors"
        style={{ top: btnPos.top, left: btnPos.left }}
        title="Insert block"
        aria-label="Insert block"
        aria-haspopup="dialog"
        aria-expanded={popoverOpen}
      >
        <Plus size={16} aria-hidden />
      </button>

      {/* Popover — two-column preview menu on desktop, full-width bottom sheet on mobile */}
      {popoverOpen && (
        <div
          ref={popoverRef}
          className={
            isMobile
              ? 'fixed z-40 inset-x-0 bottom-0 max-h-[70vh] flex flex-col bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 overflow-hidden'
              : 'fixed z-40 w-[560px] h-[400px] max-h-[80vh] flex bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden'
          }
          style={
            isMobile
              ? undefined
              : {
                  top: flipUp ? undefined : btnPos.top + 32,
                  bottom: flipUp ? window.innerHeight - btnPos.top + 4 : undefined,
                  left: desktopLeft,
                }
          }
          role={isMobile ? 'dialog' : 'menu'}
          aria-label="Insert block"
        >
          {/* Left column: Gallery button + filter + block list */}
          <div className={isMobile ? 'flex-1 flex flex-col overflow-hidden' : 'w-64 flex flex-col h-full min-h-0'}>
            <div className="p-2 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-1.5">
              <button
                type="button"
                onClick={() => handleOpenGallery()}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-blue-600" aria-hidden />
                  Browse Full Block Gallery…
                </span>
                <span className="text-[10px] text-slate-400">All</span>
              </button>

              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  ref={filterInputRef}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter blocks…"
                  aria-label="Filter blocks in insert menu"
                  className="w-full pl-7 pr-7 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
                {filter && (
                  <button
                    type="button"
                    onClick={() => { setFilter(''); filterInputRef.current?.focus(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear filter"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {grouped.map((group) => (
                <div key={group.category}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.category}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !isMobile && hoveredItem?.id === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={() => setHoveredItem(item)}
                        onFocus={() => setHoveredItem(item)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
                          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <Icon size={15} className="shrink-0 opacity-60" />
                        <div className="min-w-0">
                          <div className="font-medium truncate text-[13px]">{item.label}</div>
                          <div className="text-[11px] text-slate-400 truncate">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              {grouped.length === 0 && (
                <div className="py-8 px-3 text-center text-xs text-slate-400">
                  No blocks match &ldquo;{filter}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Right column (desktop): Flyout Preview */}
          {!isMobile && hoveredItem && (
            <div className="w-76 flex-1 border-l border-slate-100 bg-slate-50/60 h-full min-h-0 flex flex-col">
              <BlockFlyoutCard
                item={hoveredItem}
                onSelectDefault={handleItemClick}
                onSelectPreset={handlePresetClick}
                onOpenGallery={handleOpenGallery}
                compact
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
