import { NodeViewWrapper } from '@tiptap/react';
import { useRef, useState, useCallback } from 'react';
import { ImageIcon, Upload } from 'lucide-react';
import { compressImageToWebP } from '../utils/imageCompressor';

export const ImagePlaceholderView = ({ editor, getPos, node }: any) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replaceWithImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setIsProcessing(true);
      try {
        const base64 = await compressImageToWebP(file);
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos == null) return;
        editor
          .chain()
          .insertContentAt(
            { from: pos, to: pos + node.nodeSize },
            { type: 'annotatedImage', attrs: { src: base64 } }
          )
          .run();
      } catch (err) {
        console.error('Failed to process image:', err);
        setIsProcessing(false);
      }
    },
    [editor, getPos, node]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) replaceWithImage(file);
    },
    [replaceWithImage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) replaceWithImage(file);
    },
    [replaceWithImage]
  );

  return (
    <NodeViewWrapper className="my-4">
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed
          cursor-pointer select-none transition-all duration-150 py-12
          ${isDraggingOver
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Processing…</span>
          </div>
        ) : (
          <>
            <div className={`p-3 rounded-full transition-colors ${isDraggingOver ? 'bg-blue-100' : 'bg-slate-200'}`}>
              {isDraggingOver ? (
                <Upload size={24} className="text-blue-500" />
              ) : (
                <ImageIcon size={24} className="text-slate-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                {isDraggingOver ? 'Drop to add image' : 'Drag an image here'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">or click to browse</p>
            </div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </NodeViewWrapper>
  );
};
