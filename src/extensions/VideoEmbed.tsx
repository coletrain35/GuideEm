import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Play, Edit2, Trash2 } from 'lucide-react';

export const parseVideoURL = (url: string): { type: 'youtube' | 'vimeo' | 'html5' | null; embedSrc: string } => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', embedSrc: `https://www.youtube.com/embed/${ytMatch[1]}` };

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', embedSrc: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'html5', embedSrc: url };

  return { type: null, embedSrc: '' };
};

const VideoEmbedNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const { src } = node.attrs;
  const [inputUrl, setInputUrl] = useState('');
  const [isEditing, setIsEditing] = useState(!src);

  const parsed = src ? parseVideoURL(src) : null;

  const handleSubmit = () => {
    if (!inputUrl.trim()) return;
    updateAttributes({ src: inputUrl.trim() });
    setIsEditing(false);
    setInputUrl('');
  };

  return (
    <NodeViewWrapper className={`relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl' : ''}`}>
      {selected && src && (
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <button
            onClick={() => { setInputUrl(src); setIsEditing(true); }}
            className="p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-blue-600 transition-colors"
            title="Edit URL"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => deleteNode()}
            className="p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {isEditing || !src ? (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 text-slate-500">
            <Play size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Paste a YouTube, Vimeo, or direct video URL</p>
          <div className="flex gap-2 w-full max-w-md">
            <input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') { setIsEditing(false); setInputUrl(''); }
              }}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Embed
            </button>
            {src && (
              <button
                onClick={() => { setIsEditing(false); setInputUrl(''); }}
                className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : parsed?.type === 'html5' ? (
        <video
          src={parsed.embedSrc}
          controls
          className="w-full rounded-xl shadow-md"
          style={{ aspectRatio: '16/9' }}
        />
      ) : parsed?.embedSrc ? (
        <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={parsed.embedSrc}
            title="Video embed"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      ) : (
        <div className="border-2 border-dashed border-red-300 rounded-xl p-6 bg-red-50 text-center text-red-600 text-sm">
          Unsupported video URL. Try YouTube, Vimeo, or a direct .mp4/.webm link.
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-src') || '',
        renderHTML: (attrs) => ({ 'data-src': attrs.src }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'video-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedNodeView);
  },
});
