import React from 'react';
import { Document } from '../utils/storage';
import { Plus, FileText, Trash2 } from 'lucide-react';

interface SidebarProps {
  documents: Document[];
  currentDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onDeleteDoc: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  documents, currentDocId, onSelectDoc, onCreateDoc, onDeleteDoc 
}) => {
  // Sort documents so the most recently edited is at the top
  const sortedDocs = [...documents].sort((a, b) => b.lastEdited - a.lastEdited);

  return (
    <aside className="flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800 flex-shrink-0">
      
      {/* Workspace Header & New Button */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            GuideEm'
          </span>
          <button 
            onClick={onCreateDoc} 
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" 
            title="New Document"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedDocs.length === 0 ? (
          <p className="text-xs text-center text-slate-500 mt-4">No documents yet.</p>
        ) : (
          sortedDocs.map(doc => (
            <div 
              key={doc.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                currentDocId === doc.id 
                  ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-200'
              }`}
              onClick={() => onSelectDoc(doc.id)}
            >
              <div className="flex flex-col truncate pr-2">
                <span className="truncate text-sm font-medium">{doc.title || 'Untitled Guide'}</span>
                <span className="text-xs opacity-50">{new Date(doc.lastEdited).toLocaleDateString()}</span>
              </div>
              
              {/* Delete Button (Only visible on hover) */}
              <button 
                onClick={(e) => onDeleteDoc(doc.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
                title="Delete Document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

    </aside>
  );
};
