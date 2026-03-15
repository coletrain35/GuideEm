import React, { useState, useEffect, useRef } from 'react';
import { generateHTML } from '../utils/exporter';
import { ThemeConfig } from '../utils/storage';
import { landingPageTitle, landingPageHtmlContent } from '../data/landingPageContent';

interface LandingPageProps {
  onStartWriting: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartWriting }) => {
  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: '#2563eb', // Blue
    fontFamily: 'modern',
    features: {
      stickyHeader: true,
      scrollReveal: true,
      darkModeSupport: false,
      readingProgressBar: false,
      backToTop: false,
      printStylesheet: true,
      shareButtons: false,
    },
    hero: {
      enabled: false,
      subtitle: '',
      coverImageBase64: null,
      layout: 'full',
    },
    footer: {
      enabled: false,
      text: '© 2025 GuideEm',
      links: [
        { label: 'GitHub', url: 'https://github.com/coletrain35/GuideEm' },
        { label: 'Get Started', url: '#' },
      ],
      showBranding: true,
    },
    codeTheme: 'dark',
  });

  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [iframeScale, setIframeScale] = useState(1);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const IFRAME_DESIGN_WIDTH = 800;

  useEffect(() => {
    const el = iframeContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIframeScale(Math.min(1, entry.contentRect.width / IFRAME_DESIGN_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-generate HTML when theme changes
  useEffect(() => {
    // We add a tiny delay to ensure CSS is loaded if this is the first render
    const timeout = setTimeout(() => {
      let html = generateHTML(landingPageTitle, landingPageHtmlContent, theme);
      if (isDarkMode) {
        html = html.replace('<html lang="en">', '<html lang="en" class="dark">');
      }
      setGeneratedHtml(html);
    }, 50);
    return () => clearTimeout(timeout);
  }, [theme, isDarkMode]);

  // Handle color change
  const handleColorChange = (color: string) => {
    setTheme(prev => ({ ...prev, primaryColor: color }));
  };

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(prev => ({
      ...prev,
      features: { ...prev.features, darkModeSupport: !isDarkMode }
    }));
  };

  // Create an iframe to display the generated HTML without CSS bleeding
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* 1. The Marketing Hero */}
      <section className="pt-32 pb-20 text-center px-4 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="GuideEm" className="h-24 md:h-32 w-auto" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Zero-Dependency <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">User Guides.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Build interactive, standalone documentation that runs natively anywhere. 
            Scroll down to experience a live exported file.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onStartWriting}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-semibold shadow-[0_0_40px_-10px_rgba(15,23,42,0.5)] hover:shadow-[0_0_60px_-15px_rgba(15,23,42,0.7)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Writing Locally
            </button>
            <a
              href="https://github.com/coletrain35/GuideEm"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-semibold rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 text-center"
            >
              View Source on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* 2. The Showcase Section */}
      <section className="max-w-[90rem] mx-auto px-4 pb-32 lg:flex lg:gap-12 items-start relative z-20">
        
        {/* Sticky Marketing Narrator */}
        <div className="lg:w-1/4 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto space-y-8 mb-12 lg:mb-0 scrollbar-hide">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Try it out</h3>
            <p className="text-slate-600 mt-3 leading-relaxed">
              Interact with the document on the right. 
              Everything you see is a single HTML file—no external CSS or JS files required.
            </p>
          </div>
          
          {/* Combined features + theming card */}
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="bg-slate-100 p-1.5 rounded-md">🎨</span>
              Live Theming
            </h4>
            <p className="text-sm text-slate-500 mb-5">
              Watch the document instantly update its CSS variables.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Color Palette</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleColorChange('#2563eb')}
                    className={`w-10 h-10 rounded-full bg-blue-600 shadow-sm transition-transform hover:scale-110 ${theme.primaryColor === '#2563eb' ? 'ring-4 ring-blue-600/30 ring-offset-2' : ''}`}
                    title="Blue"
                  />
                  <button 
                    onClick={() => handleColorChange('#10b981')}
                    className={`w-10 h-10 rounded-full bg-emerald-500 shadow-sm transition-transform hover:scale-110 ${theme.primaryColor === '#10b981' ? 'ring-4 ring-emerald-500/30 ring-offset-2' : ''}`}
                    title="Emerald"
                  />
                  <button 
                    onClick={() => handleColorChange('#8b5cf6')}
                    className={`w-10 h-10 rounded-full bg-violet-500 shadow-sm transition-transform hover:scale-110 ${theme.primaryColor === '#8b5cf6' ? 'ring-4 ring-violet-500/30 ring-offset-2' : ''}`}
                    title="Violet"
                  />
                  <button 
                    onClick={() => handleColorChange('#f97316')}
                    className={`w-10 h-10 rounded-full bg-orange-500 shadow-sm transition-transform hover:scale-110 ${theme.primaryColor === '#f97316' ? 'ring-4 ring-orange-500/30 ring-offset-2' : ''}`}
                    title="Orange"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label onClick={toggleDarkMode} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Dark Mode</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
                <label
                  onClick={() => setTheme(prev => ({ ...prev, features: { ...prev.features, readingProgressBar: !prev.features.readingProgressBar } }))}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Progress Bar</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${theme.features.readingProgressBar ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${theme.features.readingProgressBar ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
                <label
                  onClick={() => setTheme(prev => ({ ...prev, features: { ...prev.features, backToTop: !prev.features.backToTop } }))}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Back-to-Top</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${theme.features.backToTop ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${theme.features.backToTop ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
                <label
                  onClick={() => setTheme(prev => ({ ...prev, footer: { ...(prev.footer ?? { text: '© 2025 GuideEm', links: [], showBranding: true }), enabled: !prev.footer?.enabled } }))}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Footer</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${theme.footer?.enabled ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${theme.footer?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
                <label
                  onClick={() => setTheme(prev => ({ ...prev, features: { ...prev.features, shareButtons: !prev.features.shareButtons } }))}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Share Buttons</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${theme.features.shareButtons ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${theme.features.shareButtons ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
                <label
                  onClick={() => setTheme(prev => ({ ...prev, features: { ...prev.features, scrollReveal: !prev.features.scrollReveal } }))}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Scroll Reveal</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${theme.features.scrollReveal ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${theme.features.scrollReveal ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Code Block Theme</label>
                <div className="flex gap-2">
                  {(['dark', 'light', 'solarized'] as const).map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setTheme(prev => ({ ...prev, codeTheme: ct }))}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors
                        ${theme.codeTheme === ct ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scroll the document to see all 19 sections — accordions, tabs, timelines, counters, hero banners, testimonials, code diffs, before/after sliders, scroll reveal, animated dividers, confetti, glass callouts, language-tinted inline code, image effects, and more.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Live Document Container */}
        <div className="lg:w-3/4 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden ring-1 ring-slate-900/5 flex flex-col h-[70vh] sm:h-[80vh] lg:h-[800px] xl:h-[900px] transition-all duration-500">
           {/* Browser Window UI Header */}
           <div className="bg-slate-100 flex-shrink-0 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400/90 shadow-sm" />
                 <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-sm" />
                 <div className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-sm" />
               </div>
               <img src="/logo.png" alt="GuideEm" className="h-5 w-auto opacity-70" />
             </div>
             <div className="flex-1 max-w-sm mx-4">
                <div className="bg-white/60 text-slate-400 text-xs font-mono py-1.5 px-3 rounded-md text-center border border-slate-200/50 truncate">
                  file:///local/demo/exported-guide.html
                </div>
             </div>
             <div className="w-[44px]"></div> {/* Spacer to center the URL bar */}
           </div>
           
           {/* Hosted iframe perfectly isolating the output */}
           <div ref={iframeContainerRef} className="flex-1 relative bg-white overflow-hidden">
             {generatedHtml ? (
               <iframe
                 srcDoc={generatedHtml}
                 title="Exported Document Preview"
                 style={iframeScale < 1 ? {
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   width: `${IFRAME_DESIGN_WIDTH}px`,
                   height: `${100 / iframeScale}%`,
                   border: 'none',
                   transform: `scale(${iframeScale})`,
                   transformOrigin: 'top left',
                 } : {
                   position: 'absolute',
                   inset: 0,
                   width: '100%',
                   height: '100%',
                   border: 'none',
                 }}
                 sandbox="allow-scripts allow-same-origin allow-presentation"
               />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Generating standalone HTML...</p>
                  </div>
               </div>
             )}
           </div>
        </div>

      </section>
    </div>
  );
};
