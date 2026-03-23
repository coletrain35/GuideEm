import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { ExternalLink, Github, Image as ImageIcon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

const CardPreview = ({ card }: { card: GalleryCard }) => (
  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
    {card.thumbnail ? (
      <div className="h-40 overflow-hidden">
        <img src={card.thumbnail} alt={card.title} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div
        className="h-40 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${card.accentColor}22, ${card.accentColor}0a)` }}
      >
        <ImageIcon size={28} className="opacity-30 text-slate-400" />
      </div>
    )}
    <div className="p-4">
      <h3 className="font-bold text-slate-900 text-base mb-1 leading-tight truncate">{card.title || 'Project Title'}</h3>
      <p className="text-slate-500 text-xs mb-2 line-clamp-2 leading-relaxed">{card.description || 'No description.'}</p>
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${card.accentColor}18`, color: card.accentColor }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs">
        {card.liveUrl && (
          <span className="flex items-center gap-1 font-medium" style={{ color: card.accentColor }}>
            <ExternalLink size={11} /> Live
          </span>
        )}
        {card.repoUrl && (
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <Github size={11} /> Repo
          </span>
        )}
      </div>
    </div>
  </div>
);

const ProjectGalleryNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const cols = node.attrs.cols as number;

  const cards: GalleryCard[] = (() => {
    try { return JSON.parse(node.attrs.cards); } catch { return []; }
  })();

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateCards = (next: GalleryCard[]) => updateAttributes({ cards: JSON.stringify(next) });
  const updateCard = (idx: number, patch: Partial<GalleryCard>) =>
    updateCards(cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const handleTagsChange = (idx: number, value: string) =>
    updateCard(idx, { tags: value.split(',').map((t) => t.trim()).filter(Boolean) });

  const handleThumbnailUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateCard(idx, { thumbnail: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const addCard = () => {
    updateCards([...cards, { ...DEFAULT_CARD }]);
    setExpandedIdx(cards.length);
  };

  const removeCard = (idx: number) => {
    updateCards(cards.filter((_, i) => i !== idx));
    setExpandedIdx((prev) => {
      if (prev === idx) return null;
      if (prev !== null && prev > idx) return prev - 1;
      return prev;
    });
  };

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Grid preview */}
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cards.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <ImageIcon size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="text-xs mt-1">Use the panel below to add your first project card</p>
          </div>
        ) : (
          cards.map((card, i) => <CardPreview key={i} card={card} />)
        )}
      </div>

      {/* Edit panel */}
      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
          {/* Settings header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
            <span className="text-xs font-semibold text-slate-600">Project Gallery</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-slate-400 mr-1">Columns:</span>
              {[2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => updateAttributes({ cols: n })}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                    cols === n
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 bg-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Card list */}
          <div className="divide-y divide-slate-200">
            {cards.map((card, idx) => (
              <div key={idx}>
                <div
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    {card.thumbnail ? (
                      <img src={card.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `${card.accentColor}18` }}
                      >
                        <ImageIcon size={12} style={{ color: card.accentColor }} />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                    {card.title || 'Untitled'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCard(idx); }}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  {expandedIdx === idx
                    ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" />
                    : <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />}
                </div>

                {expandedIdx === idx && (
                  <div className="px-4 pb-4 pt-2 bg-white space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-0.5">Title</label>
                        <input
                          value={card.title}
                          onChange={(e) => updateCard(idx, { title: e.target.value })}
                          placeholder="Project Title"
                          className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-0.5">Accent Color</label>
                        <input
                          type="color"
                          value={card.accentColor}
                          onChange={(e) => updateCard(idx, { accentColor: e.target.value })}
                          className="w-full h-[30px] cursor-pointer rounded border border-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-0.5">Description</label>
                      <textarea
                        value={card.description}
                        onChange={(e) => updateCard(idx, { description: e.target.value })}
                        placeholder="Brief project description..."
                        rows={2}
                        className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 resize-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-0.5">
                        Tags <span className="font-normal text-slate-400">(comma-separated)</span>
                      </label>
                      <input
                        value={card.tags.join(', ')}
                        onChange={(e) => handleTagsChange(idx, e.target.value)}
                        placeholder="React, TypeScript, 2024"
                        className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-0.5">Live URL</label>
                        <input
                          value={card.liveUrl}
                          onChange={(e) => updateCard(idx, { liveUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-0.5">Repo URL</label>
                        <input
                          value={card.repoUrl}
                          onChange={(e) => updateCard(idx, { repoUrl: e.target.value })}
                          placeholder="https://github.com/..."
                          className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-0.5">Thumbnail</label>
                      <div className="flex gap-2">
                        <input
                          value={card.thumbnail?.startsWith('data:') ? '' : card.thumbnail}
                          onChange={(e) => updateCard(idx, { thumbnail: e.target.value })}
                          placeholder="https://... or upload"
                          className="flex-1 px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                        />
                        <button
                          onClick={() => fileInputRefs.current[idx]?.click()}
                          className="px-3 py-1 text-sm border rounded border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Upload
                        </button>
                        <input
                          ref={(el) => { fileInputRefs.current[idx] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleThumbnailUpload(idx, e)}
                        />
                      </div>
                      {card.thumbnail && (
                        <button
                          onClick={() => updateCard(idx, { thumbnail: '' })}
                          className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                          Remove thumbnail
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add card */}
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={addCard}
              className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors w-full justify-center font-medium border border-dashed border-indigo-200"
            >
              <Plus size={14} /> Add Project Card
            </button>
          </div>
        </div>
      )}
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
          { thumbnail: '', title: 'Project Title', description: 'A short description.', tags: [], liveUrl: '', repoUrl: '', accentColor: '#6366f1' },
          { thumbnail: '', title: 'Project Title', description: 'A short description.', tags: [], liveUrl: '', repoUrl: '', accentColor: '#6366f1' },
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
