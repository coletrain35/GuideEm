import React from 'react';
import { Trash2, Copy } from 'lucide-react';
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

  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
      {getPos && editor && node && (
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
          title="Duplicate block"
        >
          <Copy size={14} />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode();
        }}
        className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
        title="Delete block"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
