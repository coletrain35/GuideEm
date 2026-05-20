import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// --- TabPanel ---

const TabPanelNodeView = (props: any) => {
  const { node } = props;
  const { active } = node.attrs;

  return (
    <NodeViewWrapper
      className="tab-panel-editor"
      style={{ display: active ? 'block' : 'none' }}
      data-active={active ? 'true' : 'false'}
    >
      <NodeViewContent className="p-5 min-h-[120px] prose prose-slate prose-sm max-w-none focus:outline-none" />
    </NodeViewWrapper>
  );
};

export const TabPanel = Node.create({
  name: 'tabPanel',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      label: {
        default: 'Tab',
        parseHTML: (el) => el.getAttribute('data-label') || 'Tab',
        renderHTML: (attrs) => ({ 'data-label': attrs.label }),
      },
      active: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-active') === 'true',
        renderHTML: (attrs) => ({ 'data-active': String(attrs.active) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tab-panel"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-panel' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabPanelNodeView);
  },
});

// --- TabGroup (parent) ---

const TabGroupNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos } = props;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scan children to determine active index
  let activeIndex = 0;
  let hasActive = false;
  const labels: string[] = [];

  node.forEach((child: any, offset: number, i: number) => {
    labels.push(child.attrs.label || `Tab ${i + 1}`);
    if (child.attrs.active) {
      activeIndex = i;
      hasActive = true;
    }
  });

  const safeActive = Math.min(activeIndex, Math.max(0, node.childCount - 1));

  // Auto-activate the first tab if none is active on load
  useEffect(() => {
    if (!hasActive && node.childCount > 0) {
      const pos = typeof getPos === 'function' ? getPos() : undefined;
      if (pos === undefined) return;
      editor.chain().focus().command(({ tr }: any) => {
        tr.setNodeMarkup(pos + 1, undefined, {
          ...node.child(0).attrs,
          active: true,
        });
        return true;
      }).run();
    }
  }, [hasActive, node.childCount]);

  // Focus double-click input
  useEffect(() => {
    if (editingIndex !== null) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editingIndex]);

  const setActiveTab = (index: number) => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;

    editor.chain().focus().command(({ tr }: any) => {
      let childStart = pos + 1;
      node.forEach((child: any, offset: number, i: number) => {
        tr.setNodeMarkup(childStart + offset, undefined, {
          ...child.attrs,
          active: i === index,
        });
      });
      return true;
    }).run();
  };

  const updateLabel = (index: number, newLabel: string) => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    
    let childStart = pos + 1;
    node.forEach((child: any, offset: number, i: number) => {
      if (i === index) {
        editor.chain().focus().command(({ tr }: any) => {
          tr.setNodeMarkup(childStart + offset, undefined, { ...child.attrs, label: newLabel });
          return true;
        }).run();
      }
    });
  };

  const addTab = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;
    const tabCount = node.childCount;

    // We set the new tab to active, and make all existing tabs inactive
    editor.chain().focus().command(({ tr }: any) => {
      let childStart = pos + 1;
      node.forEach((child: any, offset: number, i: number) => {
        tr.setNodeMarkup(childStart + offset, undefined, {
          ...child.attrs,
          active: false,
        });
      });
      return true;
    }).insertContentAt(endPos, {
      type: 'tabPanel',
      attrs: { label: `Tab ${tabCount + 1}`, active: true },
      content: [{ type: 'paragraph' }],
    }).run();
  };

  const removeTab = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (node.childCount <= 1) return; // keep at least one
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;

    let childStart = pos + 1;
    let nextActive = safeActive;
    if (index === safeActive) {
      nextActive = Math.max(0, index - 1);
    } else if (index < safeActive) {
      nextActive = safeActive - 1;
    }

    editor.chain().focus().command(({ tr }: any) => {
      // 1. Delete the tab panel range
      let siblingOffset = 0;
      let targetStart = 0;
      let targetEnd = 0;
      node.forEach((child: any, offset: number, i: number) => {
        if (i === index) {
          targetStart = childStart + offset;
          targetEnd = targetStart + child.nodeSize;
        }
      });
      tr.delete(targetStart, targetEnd);
      return true;
    }).command(({ tr }: any) => {
      // 2. Scan remaining children in updated transaction and set the correct one as active
      // Note: Node state inside the transaction needs to be fetched from the resolved positions
      const parentNode = tr.doc.nodeAt(pos);
      if (parentNode) {
        let childStartPos = pos + 1;
        parentNode.forEach((child: any, offset: number, i: number) => {
          tr.setNodeMarkup(childStartPos + offset, undefined, {
            ...child.attrs,
            active: i === nextActive,
          });
        });
      }
      return true;
    }).run();

    setEditingIndex(null);
  };

  const commitLabelEdit = () => setEditingIndex(null);

  return (
    <NodeViewWrapper className={`group/block relative my-8 transition-all ${selected ? 'ring-2 ring-slate-100 rounded-xl p-2 bg-slate-50/30' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Real Tab Bar */}
      <div className="flex items-end gap-1.5 border-b border-slate-200 overflow-x-auto px-2">
        {labels.map((label, i) => {
          const isActive = safeActive === i;
          return (
            <div
              key={i}
              className={`group/tab relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium cursor-pointer select-none whitespace-nowrap transition-all border-t-2 border-x rounded-t-lg -mb-[1px] ${
                isActive
                  ? 'text-indigo-600 border-t-indigo-500 border-x-slate-200 bg-white z-10 font-bold shadow-sm'
                  : 'text-slate-500 border-transparent bg-transparent hover:text-slate-700 hover:bg-slate-50/50'
              }`}
              onClick={() => setActiveTab(i)}
            >
              {editingIndex === i ? (
                <input
                  ref={inputRef}
                  value={label}
                  onChange={(e) => updateLabel(i, e.target.value)}
                  onBlur={commitLabelEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') commitLabelEdit();
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent outline-none text-sm font-semibold text-indigo-600 border-b border-indigo-400 py-0 px-0.5"
                  style={{ width: `${Math.max(label.length, 3) + 1}ch` }}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(i);
                    setEditingIndex(i);
                  }}
                  title="Double-click to rename"
                  className="py-0.5"
                >
                  {label}
                </span>
              )}

              {/* Remove Tab Button */}
              {node.childCount > 1 && (
                <button
                  onClick={(e) => removeTab(e, i)}
                  className="opacity-0 group-hover/tab:opacity-100 transition-opacity ml-1 rounded-full p-0.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Tab Button */}
        <button
          onClick={addTab}
          className="flex items-center justify-center p-1.5 mb-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Add Tab"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Unified Content Box */}
      <div className="border border-slate-200 rounded-b-xl bg-white shadow-sm overflow-hidden mt-0">
        <NodeViewContent className="tab-group-content" />
      </div>
    </NodeViewWrapper>
  );
};

export const TabGroup = Node.create({
  name: 'tabGroup',
  group: 'block',
  content: 'tabPanel+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="tab-group"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-group' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabGroupNodeView);
  },
});
