import React from 'react';
import { Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import type { Node } from 'prosemirror-model';

interface BlockDeleteButtonProps {
  deleteNode: () => void;
  getPos?: () => number | undefined;
  editor?: Editor;
  node?: Node;
}

export const BlockDeleteButton = ({ deleteNode, getPos, editor, node }: BlockDeleteButtonProps) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!getPos || !editor || !node) return;
    const pos = getPos();
    if (pos === undefined) return;
    const insertPos = pos + node.nodeSize;
    try {
      editor.chain().focus().insertContentAt(insertPos, node.toJSON()).run();
    } catch {
      // insertContentAt may fail for complex nested structures; silently ignore
    }
  };

  const handleMove = (e: React.MouseEvent, dir: 'up' | 'down') => {
    e.stopPropagation();
    if (!getPos || !editor || !node) return;
    const pos = getPos();
    if (pos === undefined) return;
    try {
      const $pos = editor.state.doc.resolve(pos);
      const parent = $pos.parent;
      const idx = $pos.index($pos.depth);
      if (parent.child(idx) !== node) return;
      if (dir === 'up' && idx > 0) {
        const prevNode = parent.child(idx - 1);
        const prevPos = pos - prevNode.nodeSize;
        editor.view.dispatch(
          editor.state.tr.delete(pos, pos + node.nodeSize).insert(prevPos, node)
        );
      } else if (dir === 'down' && idx < parent.childCount - 1) {
        const nextNode = parent.child(idx + 1);
        editor.view.dispatch(
          editor.state.tr.delete(pos, pos + node.nodeSize).insert(pos + nextNode.nodeSize, node)
        );
      }
    } catch {
      // Ignore invalid position errors
    }
  };

  return (
    <div className="absolute -top-3 right-3 z-20 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm opacity-0 group-hover/block:opacity-100 focus-within:opacity-100 transition-opacity">
      {getPos && editor && node && (
        <>
          <button
            type="button"
            onClick={(e) => handleMove(e, 'up')}
            className="move-block-up-btn p-1 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            title="Move block up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => handleMove(e, 'down')}
            className="move-block-down-btn p-1 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            title="Move block down"
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
            title="Duplicate block"
          >
            <Copy size={13} />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          deleteNode();
        }}
        className="p-1 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
        title="Delete block"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
