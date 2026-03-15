import React from 'react';
import { Trash2 } from 'lucide-react';

export const BlockDeleteButton = ({ deleteNode }: { deleteNode: () => void }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      deleteNode();
    }}
    className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover/block:opacity-100"
    title="Delete block"
  >
    <Trash2 size={16} />
  </button>
);
