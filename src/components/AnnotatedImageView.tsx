import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { BlockDeleteButton } from './BlockDeleteButton';

export const AnnotatedImageView = ({ node, updateAttributes, selected, editor, deleteNode }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!editor.isEditable) return;
    
    // If we are currently editing a hotspot, clicking elsewhere on the image closes it
    if (editingId) {
      setEditingId(null);
      return;
    }
    
    // Otherwise, add a new hotspot at the clicked coordinates
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newAnnotation = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      text: 'New note'
    };
    
    updateAttributes({
      annotations: [...(node.attrs.annotations || []), newAnnotation]
    });
    setEditingId(newAnnotation.id);
  };

  const updateAnnotation = (id: string, text: string) => {
    const newAnnotations = node.attrs.annotations.map((a: any) => 
      a.id === id ? { ...a, text } : a
    );
    updateAttributes({ annotations: newAnnotations });
  };

  const deleteAnnotation = (id: string) => {
    const newAnnotations = node.attrs.annotations.filter((a: any) => a.id !== id);
    updateAttributes({ annotations: newAnnotations });
    setEditingId(null);
  };

  const effect = node.attrs.effect || 'none';

  return (
    <NodeViewWrapper className={`group/block relative block my-8 ${selected ? 'ring-4 ring-blue-500/50 rounded-lg' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} />
      {selected && editor.isEditable && (
        <div className="absolute -top-16 left-0 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-10 flex items-center justify-between gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-xs font-bold">+</span>
            <span>Click anywhere on the image to add a hotspot marker</span>
          </div>
          <select
            value={effect}
            onChange={(e) => { e.stopPropagation(); updateAttributes({ effect: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 cursor-pointer flex-shrink-0"
          >
            <option value="none">No Effect</option>
            <option value="tilt-on-hover">Tilt on Hover</option>
            <option value="polaroid">Polaroid</option>
            <option value="film-strip">Film Strip</option>
          </select>
        </div>
      )}
      <div
        ref={containerRef}
        className={`relative inline-block w-full cursor-crosshair${effect !== 'none' ? ` image-effect-${effect}` : ''}`}
        onClick={handleImageClick}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="block w-full rounded-lg shadow-sm"
        />
        
        {(node.attrs.annotations || []).map((ann: any, i: number) => (
          <div 
            key={ann.id} 
            style={{ left: `${ann.x}%`, top: `${ann.y}%` }} 
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
            onClick={(e) => {
              e.stopPropagation();
              if (editor.isEditable) setEditingId(ann.id);
            }}
          >
            {/* The Marker Dot */}
            <div className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white transition-transform ${editingId === ann.id ? 'bg-amber-500 scale-110 ring-4 ring-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'} text-white cursor-pointer`}>
              {i + 1}
            </div>
            
            {/* Tooltip / Editor Popover */}
            {editingId === ann.id && editor.isEditable ? (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white p-3 rounded-xl shadow-2xl border border-slate-200 z-50 max-w-[min(16rem,calc(100vw-3rem))] w-64 cursor-default animate-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-200 rotate-45"></div>
                <div className="relative z-10">
                  <textarea 
                    autoFocus 
                    value={ann.text} 
                    onChange={e => updateAnnotation(ann.id, e.target.value)} 
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                    rows={3}
                    placeholder="Enter hover text..."
                  />
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={() => deleteAnnotation(ann.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium" title="Delete hotspot">
                      <Trash2 size={14}/> Delete
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-slate-900 text-white text-sm p-3 rounded-lg shadow-xl z-40 w-max max-w-[250px] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-pre-wrap text-center translate-y-1 group-hover:translate-y-0">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                <span className="relative z-10">{ann.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
};
