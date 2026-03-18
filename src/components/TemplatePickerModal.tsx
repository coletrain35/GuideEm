import React from 'react';
import { X } from 'lucide-react';
import { TEMPLATES, type TemplateDefinition } from '../data/templates';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateDefinition) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">New Document</h2>
            <p className="text-sm text-slate-500 mt-0.5">Choose a template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group flex items-start gap-4 p-4 text-left border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{template.emoji}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors text-sm">
                    {template.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {template.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
