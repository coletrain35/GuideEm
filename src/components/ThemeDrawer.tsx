import React, { useRef, useState, useCallback } from 'react';
import { ImagePlus, X as XIcon } from 'lucide-react';
import { compressImageToWebP } from '../utils/imageCompressor';
import { useDialog } from '../utils/useDialog';
import { ThemeConfig, FooterLink } from '../utils/storage';

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  setTheme: (updates: Partial<ThemeConfig>) => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose, theme, setTheme }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const drawerRef = useDialog<HTMLDivElement>(isOpen, onClose);

  const handleLogoFile = useCallback(
    async (file: File) => {
      setLogoError(null);
      setLogoBusy(true);
      try {
        const base64 = await compressImageToWebP(file);
        setTheme({ logoBase64: base64 });
      } catch (err: any) {
        setLogoError(err?.message || 'Could not process this image.');
      } finally {
        setLogoBusy(false);
        if (logoInputRef.current) logoInputRef.current.value = '';
      }
    },
    [setTheme]
  );

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleLogoFile(file);
    },
    [handleLogoFile]
  );

  const handleRemoveLogo = useCallback(() => {
    setTheme({ logoBase64: undefined });
    setLogoError(null);
  }, [setTheme]);

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
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 w-full sm:w-80 h-full bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-drawer-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 id="theme-drawer-title" className="text-lg font-semibold text-slate-900">Theme Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close theme settings"
          >
            <span aria-hidden>✕</span>
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

          {/* 2b. Brand Logo */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Brand Logo</label>
            {theme.logoBase64 ? (
              <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                <img
                  src={theme.logoBase64}
                  alt="Brand logo preview"
                  className="h-10 w-auto max-w-[160px] object-contain bg-white border border-slate-200 rounded px-2 py-1"
                />
                <div className="flex flex-col gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoBusy}
                    className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-white text-slate-700 disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-xs px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center justify-center gap-1"
                  >
                    <XIcon size={11} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoBusy}
                className="w-full flex items-center justify-center gap-2 px-3 py-6 text-sm font-medium text-slate-600 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/40 transition-colors disabled:opacity-50"
              >
                <ImagePlus size={16} />
                {logoBusy ? 'Uploading…' : 'Upload logo'}
              </button>
            )}
            {logoError && (
              <p role="alert" className="text-xs text-rose-600">{logoError}</p>
            )}
            <p className="text-xs text-slate-500">Shown in the sticky header and brand-header of the exported guide.</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {/* 3. Interactive Web Features */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Web Page Features</label>
            
            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Sticky App Header</span>
              <div className="relative flex-shrink-0">
                <input 
                  type="checkbox" 
                  checked={theme.features?.stickyHeader ?? true}
                  onChange={(e) => setTheme({ features: { ...theme.features, stickyHeader: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>

            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Dark Mode Support</span>
              <div className="relative flex-shrink-0">
                <input 
                  type="checkbox" 
                  checked={theme.features?.darkModeSupport ?? false}
                  onChange={(e) => setTheme({ features: { ...theme.features, darkModeSupport: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>
            
            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Scroll Reveal Animations</span>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={theme.features?.scrollReveal ?? false}
                  onChange={(e) => setTheme({ features: { ...theme.features, scrollReveal: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>

            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Reading Progress Bar</span>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={theme.features?.readingProgressBar ?? false}
                  onChange={(e) => setTheme({ features: { ...theme.features, readingProgressBar: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>

            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Back-to-Top Button</span>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={theme.features?.backToTop ?? false}
                  onChange={(e) => setTheme({ features: { ...theme.features, backToTop: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>

            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Print Stylesheet</span>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={theme.features?.printStylesheet ?? true}
                  onChange={(e) => setTheme({ features: { ...theme.features, printStylesheet: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>

            <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">Share Buttons</span>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={theme.features?.shareButtons ?? false}
                  onChange={(e) => setTheme({ features: { ...theme.features, shareButtons: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
              </div>
            </label>
          </div>

          {/* 4. Code Block Theme */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Code Block Theme</label>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: 'dark', label: 'Dark', desc: 'Dark gray background' },
                { value: 'light', label: 'Light', desc: 'Light gray background' },
                { value: 'solarized', label: 'Solarized', desc: 'Classic solarized dark' },
              ] as const).map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setTheme({ codeTheme: value })}
                  className={`px-4 py-3 text-sm font-medium text-left border rounded-lg transition-colors
                    ${(theme.codeTheme ?? 'dark') === value ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300 text-slate-600'}
                  `}
                >
                  <span className="font-medium">{label}</span>
                  <span className="ml-2 text-xs text-slate-400">({desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Footer */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Footer</label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={theme.footer?.enabled ?? false}
                onChange={(e) => setTheme({ footer: { ...(theme.footer ?? { text: '', links: [], showBranding: true }), enabled: e.target.checked } })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Enable Footer</span>
            </label>

            {(theme.footer?.enabled) && (
              <div className="space-y-3 pl-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Footer Text</label>
                  <input
                    type="text"
                    value={theme.footer?.text ?? ''}
                    onChange={(e) => setTheme({ footer: { ...(theme.footer ?? { enabled: true, links: [], showBranding: true }), text: e.target.value } })}
                    placeholder="© 2025 Your Company"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Links</label>
                    <button
                      onClick={() => {
                        const links: FooterLink[] = [...(theme.footer?.links ?? []), { label: '', url: '' }];
                        setTheme({ footer: { ...(theme.footer ?? { enabled: true, text: '', showBranding: true }), links } });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Link
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(theme.footer?.links ?? []).map((link, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const links = [...(theme.footer?.links ?? [])];
                            links[i] = { ...links[i], label: e.target.value };
                            setTheme({ footer: { ...(theme.footer ?? { enabled: true, text: '', showBranding: true }), links } });
                          }}
                          placeholder="Label"
                          className="flex-1 px-2 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-blue-500 border-slate-200 min-w-0"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const links = [...(theme.footer?.links ?? [])];
                            links[i] = { ...links[i], url: e.target.value };
                            setTheme({ footer: { ...(theme.footer ?? { enabled: true, text: '', showBranding: true }), links } });
                          }}
                          placeholder="https://..."
                          className="flex-1 px-2 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-blue-500 border-slate-200 min-w-0"
                        />
                        <button
                          onClick={() => {
                            const links = (theme.footer?.links ?? []).filter((_, j) => j !== i);
                            setTheme({ footer: { ...(theme.footer ?? { enabled: true, text: '', showBranding: true }), links } });
                          }}
                          className="text-slate-400 hover:text-red-500 text-lg leading-none px-1 flex-shrink-0"
                          aria-label="Remove link"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={theme.footer?.showBranding ?? true}
                    onChange={(e) => setTheme({ footer: { ...(theme.footer ?? { enabled: true, text: '', links: [] }), showBranding: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Show "Made with GuideEm" branding</span>
                </label>
              </div>
            )}
          </div>

          {/* 6. Custom CSS */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Custom CSS</label>
            <textarea
              value={theme.customCSS ?? ''}
              onChange={(e) => setTheme({ customCSS: e.target.value })}
              placeholder="/* Add custom styles here */&#10;.guide-container h1 { color: red; }"
              rows={6}
              className="w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 border-slate-200 resize-y"
            />
            <p className="text-xs text-slate-500">Appended as the final style block in the exported HTML.</p>
          </div>

        </div>
      </div>
    </>
  );
};
