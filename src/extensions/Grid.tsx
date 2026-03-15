import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Trash2 } from 'lucide-react';

// 1. The React Component (What the author sees)
const GridNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const { layout } = node.attrs; // '50-50', '40-60', or '60-40'

  return (
    <NodeViewWrapper className={`relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-lg p-2' : ''}`}>
      
      {/* Contextual Menu: Only visible when the grid is clicked */}
      {selected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm">
          <button 
            onClick={() => updateAttributes({ layout: '50-50' })}
            className={`px-3 py-1 rounded-full hover:bg-slate-100 ${layout === '50-50' ? 'bg-slate-100 font-medium' : 'text-slate-600'}`}
          >
            50/50
          </button>
          <button 
            onClick={() => updateAttributes({ layout: '40-60' })}
            className={`px-3 py-1 rounded-full hover:bg-slate-100 ${layout === '40-60' ? 'bg-slate-100 font-medium' : 'text-slate-600'}`}
          >
            40/60
          </button>
          <button 
            onClick={() => updateAttributes({ layout: '60-40' })}
            className={`px-3 py-1 rounded-full hover:bg-slate-100 ${layout === '60-40' ? 'bg-slate-100 font-medium' : 'text-slate-600'}`}
          >
            60/40
          </button>
          
          <div className="w-px h-4 bg-slate-300 mx-1" />
          
          <button
            onClick={() => deleteNode()}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            title="Delete Grid"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* The Grid Container */}
      {/* The Grid Container */}
      <NodeViewContent className={`
        grid gap-6 w-full relative min-h-[100px]
        ${layout === '50-50' ? 'grid-cols-2' : ''}
        ${layout === '40-60' ? 'grid-cols-[2fr_3fr]' : ''}
        ${layout === '60-40' ? 'grid-cols-[3fr_2fr]' : ''}
      `} />
    </NodeViewWrapper>
  );
};

// 2. The TipTap Extension Logic
export const GridColumn = Node.create({
  name: 'gridColumn',
  content: 'block+', // Can contain paragraphs, images, code blocks, etc.
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="grid-column"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'grid-column', 
      class: 'grid-column flex-1 border border-dashed border-slate-300 rounded-lg p-4 min-h-[100px] hover:border-blue-400 focus-within:border-blue-500 transition-colors bg-slate-50/50' 
    }), 0];
  },
});

export const Grid = Node.create({
  name: 'grid',
  group: 'block',
  content: 'gridColumn{2}', // STRICT: A grid MUST contain exactly 2 columns
  isolating: true,

  addAttributes() {
    return {
      layout: {
        default: '50-50',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-layout') || '50-50',
        renderHTML: (attributes: any) => {
          return { 'data-layout': attributes.layout };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const layout = HTMLAttributes['data-layout'] || '50-50';
    const layoutClass = layout === '40-60' ? 'ratio-40-60' : 
                        layout === '60-40' ? 'ratio-60-40' : 'ratio-50-50';
    
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'grid', 
      class: `grid-wrapper ${layoutClass}` 
    }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GridNodeView);
  },
});
