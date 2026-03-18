import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
import { ExternalLink, Github, Image as ImageIcon } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const ProjectCardNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { thumbnail, title, description, tags, liveUrl, repoUrl, accentColor } = node.attrs;

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

  const handleTagsChange = (value: string) => {
    const arr = value.split(',').map((t) => t.trim()).filter(Boolean);
    updateAttributes({ tags: JSON.stringify(arr) });
  };

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-2xl overflow-hidden border-2 bg-white shadow-sm transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
      >
        {/* Thumbnail */}
        {thumbnail ? (
          <div className="h-48 overflow-hidden">
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="h-48 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:opacity-80 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}0a)` }}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={32} className="mb-2 opacity-40" />
            <span className="text-sm">Click to add thumbnail</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailUpload}
            />
          </div>
        )}

        {/* Card Body */}
        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-lg mb-1 m-0 leading-tight">
            {title || 'Project Title'}
          </h3>
          <p className="text-slate-500 text-sm mb-3 m-0 leading-relaxed line-clamp-2">
            {description || 'Add a description of your project.'}
          </p>

          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {parsedTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            {liveUrl && (
              <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: accentColor }}>
                <ExternalLink size={14} /> Live Demo
              </span>
            )}
            {repoUrl && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Github size={14} /> Repository
              </span>
            )}
            {!liveUrl && !repoUrl && (
              <span className="text-xs text-slate-300 italic">No links set</span>
            )}
          </div>
        </div>

        {/* Edit Panel */}
        {selected && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => updateAttributes({ title: e.target.value })}
                  placeholder="Project Title"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Accent Color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  className="w-full h-[30px] cursor-pointer rounded border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => updateAttributes({ description: e.target.value })}
                placeholder="Brief description of the project..."
                rows={2}
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 resize-none bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">
                Tags <span className="font-normal text-slate-400">(comma-separated)</span>
              </label>
              <input
                value={parsedTags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="Photography, 2024, Personal"
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Live URL</label>
                <input
                  value={liveUrl}
                  onChange={(e) => updateAttributes({ liveUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Repo URL</label>
                <input
                  value={repoUrl}
                  onChange={(e) => updateAttributes({ repoUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Thumbnail</label>
              <div className="flex gap-2">
                <input
                  value={thumbnail?.startsWith('data:') ? '' : thumbnail}
                  onChange={(e) => updateAttributes({ thumbnail: e.target.value })}
                  placeholder="https://... or upload an image"
                  className="flex-1 px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-sm border rounded border-slate-200 text-slate-600 hover:bg-white transition-colors"
                >
                  Upload
                </button>
              </div>
              {thumbnail && (
                <button
                  onClick={() => updateAttributes({ thumbnail: '' })}
                  className="text-xs text-red-400 hover:text-red-600 mt-1"
                >
                  Remove thumbnail
                </button>
              )}
            </div>
          </div>
        )}
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
