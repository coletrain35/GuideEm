import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Sparkles } from 'lucide-react';
import {
  BLOCK_CATEGORIES,
  insertBlockAction,
  openBlockGallery,
  type BlockItem,
  type BlockPreset,
} from '../utils/blockItems';
import { BlockFlyoutCard } from './BlockPreview';

export interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandMenuProps {
  items: BlockItem[];
  command: (item: BlockItem) => void;
  editor?: Editor;
  range?: { from: number; to: number };
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command, editor, range }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    const grouped = useMemo(
      () =>
        BLOCK_CATEGORIES.map((cat) => ({
          category: cat,
          items: items.filter((it) => it.category === cat),
        })).filter((g) => g.items.length > 0),
      [items]
    );

    const flatItems = useMemo(
      () => grouped.flatMap((g) => g.items),
      [grouped]
    );

    // Reset selection when items change
    useEffect(() => { setSelectedIndex(0); }, [items]);

    // Scroll selected item into view
    useEffect(() => {
      const el = itemRefs.current.get(selectedIndex);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const selectItem = (index: number) => {
      const item = flatItems[index];
      if (item) command(item);
    };

    const handleOpenGallery = (item?: BlockItem) => {
      if (editor && range) {
        editor.chain().focus().deleteRange(range).run();
      }
      openBlockGallery(item ? { blockId: item.id, category: item.category } : undefined);
    };

    const handleSelectPreset = (_item: BlockItem, preset: BlockPreset) => {
      if (!editor) return;
      if (range) {
        editor.chain().focus().deleteRange(range).run();
      }
      insertBlockAction(editor, preset.action);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (!flatItems.length) return false;
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + flatItems.length - 1) % flatItems.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % flatItems.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (!flatItems.length) {
      return (
        <div className="w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 space-y-2">
          <div className="text-sm text-slate-400">No matching blocks</div>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleOpenGallery(); }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
          >
            <Sparkles size={13} />
            <span>Browse Block Gallery…</span>
          </button>
        </div>
      );
    }

    const activeItem = flatItems[selectedIndex] ?? flatItems[0];
    let flatIndex = -1;

    return (
      <div className="flex bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden h-[400px] max-h-[80vh]">
        {/* Left: Block list */}
        <div className="w-64 h-full min-h-0 flex flex-col">
          <div className="p-1.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleOpenGallery(); }}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" />
                Browse Block Gallery…
              </span>
              <span className="text-[10px] text-slate-400">All</span>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
            {grouped.map((group) => (
              <div key={group.category}>
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.category}
                </div>
                {group.items.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(idx, el);
                        else itemRefs.current.delete(idx);
                      }}
                      onClick={() => selectItem(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
                        idx === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
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
          </div>
        </div>

        {/* Right: Live Preview Pane */}
        {activeItem && (
          <div
            className="hidden sm:flex flex-col w-76 h-full min-h-0 border-l border-slate-100 bg-slate-50/60"
            onMouseDown={(e) => e.preventDefault()}
          >
            <BlockFlyoutCard
              item={activeItem}
              onSelectDefault={(it) => command(it)}
              onSelectPreset={handleSelectPreset}
              onOpenGallery={(it) => handleOpenGallery(it)}
              compact
            />
          </div>
        )}
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
