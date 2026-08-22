import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { ExternalLink, Github, Image as ImageIcon, Plus, Trash2, X, Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface GalleryCard {
  thumbnail: string;
  title: string;
  description: string;
  tags: string[];
  liveUrl: string;
  repoUrl: string;
  accentColor: string;
}

const DEFAULT_CARD: GalleryCard = {
  thumbnail: '',
  title: 'Project Title',
  description: 'A short description of this project.',
  tags: [],
  liveUrl: '',
  repoUrl: '',
  accentColor: '#6366f1',
};

const GalleryCardItem = ({
  card,
  selected,
  onUpdate,
  onRemove,
}: {
  card: GalleryCard;
  selected: boolean;
  onUpdate: (patch: Partial<GalleryCard>) => void;
  onRemove: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [activeUrlEdit, setActiveUrlEdit] = useState<'live' | 'repo' | null>(null);
  const [tempUrl, setTempUrl] = useState('');

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdate({ thumbnail: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleAddTag = () => {
    const trimmed = newTagVal.trim();
    if (trimmed && !card.tags.includes(trimmed)) {
      onUpdate({ tags: [...card.tags, trimmed] });
    }
    setIsAddingTag(false);
    setNewTagVal('');
  };

  const handleRemoveTag = (idx: number) => {
    const next = card.tags.filter((_, i) => i !== idx);
    onUpdate({ tags: next });
  };

  const openUrlEdit = (type: 'live' | 'repo', current: string) => {
    setActiveUrlEdit(type);
    setTempUrl(current);
  };

  const saveUrl = () => {
    if (activeUrlEdit === 'live') {
      onUpdate({ liveUrl: tempUrl.trim() });
    } else if (activeUrlEdit === 'repo') {
      onUpdate({ repoUrl: tempUrl.trim() });
    }
    setActiveUrlEdit(null);
    setTempUrl('');
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden border bg-white shadow-sm flex flex-col justify-between transition-all ${
        selected ? 'border-slate-350 hover:border-indigo-300' : 'border-slate-200'
      }`}
    >
      {/* Card Header Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-slate-50 border-b border-slate-100 group/image">
        {card.thumbnail ? (
          <>
            <img src={card.thumbnail} alt={card.title} className="w-full h-full object-cover" />
            {selected && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded bg-white text-slate-700 text-[10px] font-semibold hover:bg-slate-100 shadow transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => onUpdate({ thumbnail: '' })}
                  className="p-1 rounded bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
                  title="Remove Thumbnail"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/20 transition-all"
            style={{ background: `linear-gradient(135deg, ${card.accentColor}12, ${card.accentColor}02)` }}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={24} className="mb-1.5 opacity-40" />
            <span className="text-xs font-semibold">Click to upload</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnailUpload}
        />

        {/* Floating actions inside thumbnail for color and removal (only in editing mode) */}
        {selected && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
            {/* Color picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-3.5 h-3.5 rounded-full border border-white shadow-sm cursor-pointer"
                style={{ backgroundColor: card.accentColor }}
                title="Accent Color"
              />
              {showColorPicker && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                  <input
                    type="color"
                    value={card.accentColor}
                    onChange={e => onUpdate({ accentColor: e.target.value })}
                    className="w-5 h-5 border border-slate-200 rounded cursor-pointer shrink-0"
                  />
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-[9px] text-slate-400 hover:text-slate-600"
                  >✕</button>
                </div>
              )}
            </div>

            {/* Remove card button */}
            <button
              onClick={onRemove}
              className="p-0.5 rounded-full bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 transition-colors"
              title="Delete Card"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title */}
          <input
            value={card.title}
            onChange={e => onUpdate({ title: e.target.value })}
            placeholder="Project Title"
            className="font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-350 focus:border-indigo-500 outline-none w-full py-0.5 mt-0 leading-tight transition-colors"
          />

          {/* Description */}
          <textarea
            value={card.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Description..."
            rows={2}
            className="text-slate-500 text-xs leading-relaxed bg-transparent border-b border-transparent hover:border-slate-355 focus:border-indigo-500 outline-none w-full py-0.5 m-0 resize-none transition-colors"
            style={{ fieldSizing: 'content' } as any}
          />
        </div>

        <div className="space-y-2.5">
          {/* Visual Interactive Tag Pills */}
          <div className="flex flex-wrap gap-1 items-center">
            {card.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all shadow-sm"
                style={{ backgroundColor: `${card.accentColor}12`, color: card.accentColor }}
              >
                <span>{tag}</span>
                {selected && (
                  <button
                    onClick={() => handleRemoveTag(idx)}
                    className="text-slate-400 hover:text-red-550 p-0.5 rounded-full hover:bg-white/50 transition-colors"
                    title="Remove tag"
                  >
                    <X size={8} />
                  </button>
                )}
              </span>
            ))}

            {selected && (
              <div className="relative inline-flex items-center">
                {isAddingTag ? (
                  <input
                    autoFocus
                    value={newTagVal}
                    onChange={(e) => setNewTagVal(e.target.value)}
                    onBlur={handleAddTag}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      else if (e.key === 'Escape') setIsAddingTag(false);
                    }}
                    placeholder="tag"
                    className="text-[9px] px-1.5 py-0.5 border border-indigo-200 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white animate-fade-in"
                    style={{ width: '54px' }}
                  />
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-dashed border-slate-300 hover:border-indigo-400 text-slate-400 hover:text-indigo-650 bg-transparent transition-colors"
                  >
                    <Plus size={8} /> Tag
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Project Links Tooltip Config Block */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1.5 border-t border-slate-50 relative">
            {/* Live Demo Link */}
            <div className="relative">
              {card.liveUrl ? (
                <div className="flex items-center gap-1">
                  <a
                    href={card.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: card.accentColor }}
                  >
                    <ExternalLink size={11} /> Live Demo
                  </a>
                  {selected && (
                    <button
                      onClick={() => openUrlEdit('live', card.liveUrl)}
                      className="text-slate-400 hover:text-slate-650 p-0.5 rounded hover:bg-slate-50 transition-colors"
                      title="Edit live URL"
                    >
                      <Paintbrush size={9} />
                    </button>
                  )}
                </div>
              ) : (
                selected && (
                  <button
                    onClick={() => openUrlEdit('live', '')}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-indigo-600 border border-dashed border-slate-200 hover:border-indigo-300 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <ExternalLink size={10} /> + Demo
                  </button>
                )
              )}

              {/* Live URL edit tooltip */}
              {activeUrlEdit === 'live' && (
                <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-slate-250 rounded-xl shadow-xl p-2.5 w-56 space-y-1.5">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Live Demo Link</span>
                  <div className="flex gap-1">
                    <input
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 text-[10px] border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={saveUrl}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[9px] font-bold transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Repository Link */}
            <div className="relative">
              {card.repoUrl ? (
                <div className="flex items-center gap-1">
                  <a
                    href={card.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-750 transition-colors"
                  >
                    <Github size={11} /> Repository
                  </a>
                  {selected && (
                    <button
                      onClick={() => openUrlEdit('repo', card.repoUrl)}
                      className="text-slate-400 hover:text-slate-650 p-0.5 rounded hover:bg-slate-50 transition-colors"
                      title="Edit repo URL"
                    >
                      <Paintbrush size={9} />
                    </button>
                  )}
                </div>
              ) : (
                selected && (
                  <button
                    onClick={() => openUrlEdit('repo', '')}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-indigo-650 border border-dashed border-slate-200 hover:border-indigo-300 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <Github size={10} /> + Repo
                  </button>
                )
              )}

              {/* Repo URL edit tooltip */}
              {activeUrlEdit === 'repo' && (
                <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-slate-250 rounded-xl shadow-xl p-2.5 w-56 space-y-1.5">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Repository Link</span>
                  <div className="flex gap-1">
                    <input
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="flex-1 text-[10px] border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={saveUrl}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[9px] font-bold transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectGalleryNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const cols = node.attrs.cols as number;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const cards: GalleryCard[] = (() => {
    try { return JSON.parse(node.attrs.cards); } catch { return []; }
  })();

  const updateCards = (next: GalleryCard[]) => updateAttributes({ cards: JSON.stringify(next) });
  
  const updateCard = (idx: number, patch: Partial<GalleryCard>) =>
    updateCards(cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const addCard = () => {
    updateCards([...cards, { ...DEFAULT_CARD, tags: ['Web', 'App'] }]);
  };

  const removeCard = (idx: number) => {
    if (cards.length <= 1) return;
    updateCards(cards.filter((_, i) => i !== idx));
  };

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Layout Grid
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-48 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Grid Columns</label>
                <div className="flex gap-1">
                  {[2, 3].map((n) => (
                    <button
                      key={n}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ cols: n })}
                      className={`flex-1 py-1 text-xs rounded border transition-all ${
                        cols === n
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n} Columns
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`p-4 rounded-2xl border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-transparent bg-transparent'
        }`}
      >
        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {cards.map((card, i) => (
            <GalleryCardItem
              key={i}
              card={card}
              selected={selected}
              onUpdate={patch => updateCard(i, patch)}
              onRemove={() => removeCard(i)}
            />
          ))}

          {/* Dash Add Card Trigger */}
          {selected && (
            <button
              onClick={addCard}
              className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-350 hover:border-indigo-400 rounded-2xl bg-white hover:bg-indigo-50/10 text-slate-450 hover:text-indigo-600 transition-all gap-1.5"
              style={{ minHeight: '260px' }}
            >
              <Plus size={24} />
              <span className="text-xs font-semibold">Add Gallery Project</span>
            </button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const ProjectGallery = Node.create({
  name: 'projectGallery',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (el) => parseInt(el.getAttribute('data-cols') || '2', 10),
        renderHTML: (attrs) => ({ 'data-cols': attrs.cols }),
      },
      cards: {
        default: JSON.stringify([
          { thumbnail: '', title: 'Photography Hub', description: 'A sleek portfolio site displaying high-resolution photography projects.', tags: ['Design', 'Photography'], liveUrl: '', repoUrl: '', accentColor: '#10b981' },
          { thumbnail: '', title: 'Developer Tools', description: 'A highly functional suite of browser-based formatting and development tools.', tags: ['React', 'CSS'], liveUrl: '', repoUrl: '', accentColor: '#6366f1' },
        ]),
        parseHTML: (el) => el.getAttribute('data-cards') || '[]',
        renderHTML: (attrs) => ({ 'data-cards': attrs.cards }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="project-gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'project-gallery' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProjectGalleryNodeView);
  },
});
