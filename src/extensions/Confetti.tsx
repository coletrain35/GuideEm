import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Trash2 } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const DEFAULT_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const ConfettiNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const { message, emoji, colors } = node.attrs;

  let parsedColors: string[] = DEFAULT_COLORS;
  try { parsedColors = JSON.parse(colors); } catch { /* use defaults */ }

  // Static confetti pieces for editor preview
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    color: parsedColors[i % parsedColors.length],
    left: `${(i * 4.3 + 2) % 96}%`,
    top: `${(i * 7.1 + 4) % 70}%`,
    rotate: `${(i * 47) % 360}deg`,
    width: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 10,
    height: i % 3 === 0 ? 8 : i % 3 === 1 ? 10 : 6,
    isCircle: i % 2 === 0,
  }));

  return (
    <NodeViewWrapper
      className={`group/block relative my-6 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl' : ''}`}
      contentEditable={false}
    >
      <BlockDeleteButton deleteNode={deleteNode} />
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 text-center" style={{ minHeight: '140px' }}>
        {/* Static confetti decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {pieces.map((p, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: p.left,
                top: p.top,
                width: p.width,
                height: p.height,
                backgroundColor: p.color,
                borderRadius: p.isCircle ? '50%' : '2px',
                transform: `rotate(${p.rotate})`,
                opacity: 0.55,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <div className="text-5xl mb-3 select-none">{emoji || '🎉'}</div>
          <div className="text-xl font-bold text-slate-900">{message || 'Congratulations!'}</div>
        </div>
      </div>

      {selected && (
        <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-slate-500 w-16 shrink-0">Message</label>
            <input
              type="text"
              value={message || ''}
              onChange={(e) => updateAttributes({ message: e.target.value })}
              className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              placeholder="Congratulations!"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-slate-500 w-16 shrink-0">Emoji</label>
            <input
              type="text"
              value={emoji || ''}
              onChange={(e) => updateAttributes({ emoji: e.target.value })}
              className="w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              placeholder="🎉"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => deleteNode()}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete block"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const Confetti = Node.create({
  name: 'confetti',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      message: {
        default: 'Congratulations!',
        parseHTML: (el) => el.getAttribute('data-message') || 'Congratulations!',
        renderHTML: (attrs) => ({ 'data-message': attrs.message }),
      },
      emoji: {
        default: '🎉',
        parseHTML: (el) => el.getAttribute('data-emoji') || '🎉',
        renderHTML: (attrs) => ({ 'data-emoji': attrs.emoji }),
      },
      colors: {
        default: JSON.stringify(DEFAULT_COLORS),
        parseHTML: (el) => el.getAttribute('data-colors') || JSON.stringify(DEFAULT_COLORS),
        renderHTML: (attrs) => ({ 'data-colors': attrs.colors }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="confetti"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'confetti', contenteditable: 'false' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConfettiNodeView);
  },
});
