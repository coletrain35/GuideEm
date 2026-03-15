import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { BlockItem } from '../utils/blockItems';
import { BLOCK_CATEGORIES } from '../utils/blockItems';

export interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandMenuProps {
  items: BlockItem[];
  command: (item: BlockItem) => void;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    // Reset selection when items change
    useEffect(() => { setSelectedIndex(0); }, [items]);

    // Scroll selected item into view
    useEffect(() => {
      const el = itemRefs.current.get(selectedIndex);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) {
      return (
        <div className="w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-3 text-sm text-slate-400">
          No matching blocks
        </div>
      );
    }

    // Group items by category while preserving order
    const grouped = BLOCK_CATEGORIES.map((cat) => ({
      category: cat,
      items: items.filter((it) => it.category === cat),
    })).filter((g) => g.items.length > 0);

    let flatIndex = -1;

    return (
      <div
        ref={scrollRef}
        className="w-72 max-h-80 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1"
      >
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
                  key={item.id}
                  ref={(el) => { if (el) itemRefs.current.set(idx, el); }}
                  onClick={() => selectItem(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
                    idx === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} className="shrink-0 opacity-60" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-xs text-slate-400 truncate">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
