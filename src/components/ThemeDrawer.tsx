import React from 'react';
import { ThemeConfig } from '../utils/storage';

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  setTheme: (updates: Partial<ThemeConfig>) => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose, theme, setTheme }) => {
  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" 
          onClick={onClose}
        />
      )}

      {/* The Drawer Panel */}
      <div className={`fixed top-0 right-0 z-50 w-80 h-full bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Theme Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-64px)]">
          
          {/* 1. Brand Color Picker */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Brand Primary Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={theme.primaryColor || '#2563eb'}
                onChange={(e) => setTheme({ primaryColor: e.target.value })}
                className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer"
              />
              <input 
                type="text" 
                value={(theme.primaryColor || '#2563eb').toUpperCase()}
                onChange={(e) => setTheme({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200"
              />
            </div>
            <p className="text-xs text-slate-500">Used for links, active states, and buttons.</p>
          </div>

          {/* 2. Typography Vibe */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Typography Style</label>
            <div className="grid grid-cols-1 gap-2">
              {(['modern', 'editorial', 'technical'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => setTheme({ fontFamily: font })}
                  className={`px-4 py-3 text-sm font-medium text-left capitalize border rounded-lg transition-colors
                    ${(theme.fontFamily || 'modern') === font ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300 text-slate-600'}
                  `}
                >
                  {font} {font === 'modern' && '(Sans-serif)'} {font === 'editorial' && '(Serif)'} {font === 'technical' && '(Mono)'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Interactive Web Features */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Web Page Features</label>
            
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50">
              <input 
                type="checkbox" 
                checked={theme.features?.stickyHeader ?? true}
                onChange={(e) => setTheme({ features: { ...theme.features, stickyHeader: e.target.checked } as any })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Sticky App Header</span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50">
              <input 
                type="checkbox" 
                checked={theme.features?.darkModeSupport ?? false}
                onChange={(e) => setTheme({ features: { ...theme.features, darkModeSupport: e.target.checked } as any })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Dark Mode Support</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50">
              <input 
                type="checkbox" 
                checked={theme.features?.scrollReveal ?? false}
                onChange={(e) => setTheme({ features: { ...theme.features, scrollReveal: e.target.checked } as any })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Scroll Reveal Animations</span>
            </label>
          </div>

        </div>
      </div>
    </>
  );
};
