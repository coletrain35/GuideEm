import { useEffect, useRef, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { Plus } from 'lucide-react';
import { BLOCK_ITEMS, BLOCK_CATEGORIES, type BlockItem } from '../utils/blockItems';

interface PlusMenuProps {
  editor: Editor;
}

export const PlusMenu = ({ editor }: PlusMenuProps) => {
  const [visible, setVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [btnPos, setBtnPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
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

      // Position to the left of the editor content
      const isMobile = window.innerWidth < 640;
      const top = rect.top;
      const left = isMobile ? editorRect.left : editorRect.left - 40;

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
    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('transaction', updatePosition);
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

  // Flip logic
  useEffect(() => {
    if (!popoverOpen || !btnRef.current) return;
    const btnRect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - btnRect.bottom;
    setFlipUp(spaceBelow < 340);
  }, [popoverOpen]);

  const handleItemClick = (item: BlockItem) => {
    setPopoverOpen(false);
    item.action(editor);
  };

  if (!visible) return null;

  // Group items by category
  const grouped = BLOCK_CATEGORIES.map((cat) => ({
    category: cat,
    items: BLOCK_ITEMS.filter((it) => it.category === cat),
  }));

  return (
    <>
      {/* + Button */}
      <button
        ref={btnRef}
        onClick={() => setPopoverOpen((v) => !v)}
        className="fixed z-30 flex items-center justify-center w-7 h-7 rounded-full border border-slate-300 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-400 shadow-sm transition-colors"
        style={{ top: btnPos.top, left: btnPos.left }}
        title="Insert block"
      >
        <Plus size={16} />
      </button>

      {/* Popover */}
      {popoverOpen && (
        <div
          ref={popoverRef}
          className="fixed z-40 w-72 max-h-80 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1"
          style={{
            top: flipUp ? undefined : btnPos.top + 32,
            bottom: flipUp ? window.innerHeight - btnPos.top + 4 : undefined,
            left: btnPos.left,
          }}
        >
          {grouped.map((group) => (
            <div key={group.category}>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.category}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
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
      )}
    </>
  );
};
