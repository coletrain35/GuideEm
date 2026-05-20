import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { ExternalLink, Github, Image as ImageIcon, Paintbrush, Trash2, X, Plus } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const ProjectCardNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { thumbnail, title, description, tags, liveUrl, repoUrl, accentColor } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [activeUrlEdit, setActiveUrlEdit] = useState<'live' | 'repo' | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const styleRef = useRef<HTMLDivElement>(null);

  const parsedTags: string[] = (() => {
    try { return JSON.parse(tags); } catch { return []; }
  })();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateAttributes({ thumbnail: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleAddTag = () => {
    const trimmed = newTagVal.trim();
    if (trimmed && !parsedTags.includes(trimmed)) {
      updateAttributes({ tags: JSON.stringify([...parsedTags, trimmed]) });
    }
    setIsAddingTag(false);
    setNewTagVal('');
  };

  const handleRemoveTag = (idx: number) => {
    const next = parsedTags.filter((_, i) => i !== idx);
    updateAttributes({ tags: JSON.stringify(next) });
  };

  const openUrlEdit = (type: 'live' | 'repo', current: string) => {
    setActiveUrlEdit(type);
    setTempUrl(current);
  };

  const saveUrl = () => {
    if (activeUrlEdit === 'live') {
      updateAttributes({ liveUrl: tempUrl.trim() });
    } else if (activeUrlEdit === 'repo') {
      updateAttributes({ repoUrl: tempUrl.trim() });
    }
    setActiveUrlEdit(null);
    setTempUrl('');
  };

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Style Accent
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-48 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                    value={accentColor || '#6366f1'}
                    onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  />
                  <span className="text-xs text-slate-500 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl overflow-hidden border bg-white shadow-sm transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
      >
        {/* Thumbnail Image Slot */}
        <div className="relative h-48 overflow-hidden bg-slate-50 border-b border-slate-100 group/image">
          {thumbnail ? (
            <>
              <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
              {selected && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow transition-colors"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={() => updateAttributes({ thumbnail: '' })}
                    className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
                    title="Remove Thumbnail"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/20 transition-all"
              style={{ background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}02)` }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={32} className="mb-2 opacity-40" />
              <span className="text-sm font-semibold">Click to upload thumbnail</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailUpload}
          />
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3.5">
          {/* Title Input */}
          <div>
            <input
              value={title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder="Project Title"
              className="font-bold text-slate-900 text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full py-0.5 mt-0 leading-tight transition-colors"
            />
          </div>

          {/* Description Textarea */}
          <div>
            <textarea
              value={description}
              onChange={(e) => updateAttributes({ description: e.target.value })}
              placeholder="Describe this project..."
              rows={2}
              className="text-slate-500 text-sm leading-relaxed bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full py-0.5 m-0 resize-none transition-colors"
              style={{ fieldSizing: 'content' } as any}
            />
          </div>

          {/* Inline Interactive Tags Row */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {parsedTags.map((tag, i) => (
              <span
                key={i}
                className="group/tag inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm transition-all"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <span>{tag}</span>
                {selected && (
                  <button
                    onClick={() => handleRemoveTag(i)}
                    className="text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-white/50 transition-colors"
                    title="Remove tag"
                  >
                    <X size={10} />
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
                    placeholder="tag..."
                    className="text-xs px-2.5 py-0.5 border border-indigo-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                    style={{ width: '68px' }}
                  />
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-dashed border-slate-300 hover:border-indigo-550 text-slate-400 hover:text-indigo-600 bg-transparent transition-colors"
                  >
                    <Plus size={10} /> Tag
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Interactive Footer Project Links */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 relative">
            {/* Live Demo URL Action */}
            <div className="relative">
              {liveUrl ? (
                <div className="flex items-center gap-1">
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: accentColor }}
                  >
                    <ExternalLink size={14} /> Live Demo
                  </a>
                  {selected && (
                    <button
                      onClick={() => openUrlEdit('live', liveUrl)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-50 transition-colors"
                      title="Edit link URL"
                    >
                      <Paintbrush size={10} />
                    </button>
                  )}
                </div>
              ) : (
                selected && (
                  <button
                    onClick={() => openUrlEdit('live', '')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 border border-dashed border-slate-200 hover:border-indigo-300 px-2 py-1 rounded transition-colors"
                  >
                    <ExternalLink size={12} /> Add Demo Link
                  </button>
                )
              )}

              {/* URL popover input for Live Demo */}
              {activeUrlEdit === 'live' && (
                <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-slate-250 rounded-xl shadow-xl p-3 w-64 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Demo Link</span>
                  <div className="flex gap-1.5">
                    <input
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 text-xs border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={saveUrl}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Repository URL Action */}
            <div className="relative">
              {repoUrl ? (
                <div className="flex items-center gap-1">
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-550 hover:text-slate-750 transition-colors"
                  >
                    <Github size={14} /> Repository
                  </a>
                  {selected && (
                    <button
                      onClick={() => openUrlEdit('repo', repoUrl)}
                      className="text-slate-400 hover:text-slate-650 p-0.5 rounded hover:bg-slate-50 transition-colors"
                      title="Edit repository URL"
                    >
                      <Paintbrush size={10} />
                    </button>
                  )}
                </div>
              ) : (
                selected && (
                  <button
                    onClick={() => openUrlEdit('repo', '')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-650 border border-dashed border-slate-200 hover:border-indigo-300 px-2 py-1 rounded transition-colors"
                  >
                    <Github size={12} /> Add Repo Link
                  </button>
                )
              )}

              {/* URL popover input for Repository */}
              {activeUrlEdit === 'repo' && (
                <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-slate-250 rounded-xl shadow-xl p-3 w-64 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repository Link</span>
                  <div className="flex gap-1.5">
                    <input
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="flex-1 text-xs border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={saveUrl}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold transition-colors"
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
    </NodeViewWrapper>
  );
};

export const ProjectCard = Node.create({
  name: 'projectCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      thumbnail: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-thumbnail') || '',
        renderHTML: (attrs) => (attrs.thumbnail ? { 'data-thumbnail': attrs.thumbnail } : {}),
      },
      title: {
        default: 'Project Title',
        parseHTML: (el) => el.getAttribute('data-title') || 'Project Title',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
      description: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-description') || '',
        renderHTML: (attrs) => (attrs.description ? { 'data-description': attrs.description } : {}),
      },
      tags: {
        default: '[]',
        parseHTML: (el) => el.getAttribute('data-tags') || '[]',
        renderHTML: (attrs) => ({ 'data-tags': attrs.tags }),
      },
      liveUrl: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-live-url') || '',
        renderHTML: (attrs) => (attrs.liveUrl ? { 'data-live-url': attrs.liveUrl } : {}),
      },
      repoUrl: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-repo-url') || '',
        renderHTML: (attrs) => (attrs.repoUrl ? { 'data-repo-url': attrs.repoUrl } : {}),
      },
      accentColor: {
        default: '#6366f1',
        parseHTML: (el) => el.getAttribute('data-accent-color') || '#6366f1',
        renderHTML: (attrs) => ({ 'data-accent-color': attrs.accentColor }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="project-card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'project-card' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProjectCardNodeView);
  },
});
