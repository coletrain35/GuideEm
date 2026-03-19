import { useCallback, useEffect, useRef } from 'react';
import type { ThemeConfig } from '../utils/storage';

interface DocumentCoverProps {
  title: string;
  onTitleChange: (title: string) => void;
  theme?: ThemeConfig;
  onThemeChange?: (updates: Partial<ThemeConfig>) => void;
}

type CoverStyle = 'none' | 'gradient' | 'dark' | 'mesh' | 'editorial';

const COVER_STYLES: { key: CoverStyle; label: string }[] = [
  { key: 'none', label: 'Plain' },
  { key: 'gradient', label: 'Gradient' },
  { key: 'dark', label: 'Dark' },
  { key: 'mesh', label: 'Mesh' },
  { key: 'editorial', label: 'Editorial' },
];

function darkenHex(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = Math.max(0, parseInt(result[1], 16) - amount);
  const g = Math.max(0, parseInt(result[2], 16) - amount);
  const b = Math.max(0, parseInt(result[3], 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function DocumentCover({ title, onTitleChange, theme, onThemeChange }: DocumentCoverProps) {
  const currentStyle: CoverStyle = theme?.hero?.style ?? 'none';
  const subtitle = theme?.hero?.subtitle ?? '';
  const primaryColor = theme?.primaryColor ?? '#2563eb';
  const coverImageBase64 = theme?.hero?.coverImageBase64 ?? null;
  const darkenedPrimary = darkenHex(primaryColor, 60);

  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  // Always-current mirrors so ref callbacks can read the latest value without stale closures
  const titleValueRef = useRef(title);
  titleValueRef.current = title;
  const subtitleValueRef = useRef(subtitle);
  subtitleValueRef.current = subtitle;

  // Ref callback: memoized so React only calls it on mount/unmount, not every render.
  // Inline functions cause React to re-invoke the callback on every render, which
  // calls node.textContent = ... and resets the cursor to the beginning.
  const titleRefCallback = useCallback((node: HTMLDivElement | null) => {
    titleRef.current = node;
    if (node) node.textContent = titleValueRef.current;
  }, []);
  const subtitleRefCallback = useCallback((node: HTMLDivElement | null) => {
    subtitleRef.current = node;
    if (node) node.textContent = subtitleValueRef.current;
  }, []);

  // Keep contenteditable in sync when the doc itself switches (external title change)
  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  }, [title]);

  useEffect(() => {
    if (subtitleRef.current && subtitleRef.current.textContent !== subtitle) {
      subtitleRef.current.textContent = subtitle;
    }
  }, [subtitle]);

  // Lazy-load DM Serif Display for editorial style
  useEffect(() => {
    if (currentStyle !== 'editorial') return;
    if (document.getElementById('dm-serif-font')) return;
    const link = document.createElement('link');
    link.id = 'dm-serif-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap';
    document.head.appendChild(link);
  }, [currentStyle]);

  const setStyle = (newStyle: CoverStyle) => {
    onThemeChange?.({
      hero: {
        style: newStyle,
        enabled: newStyle !== 'none',
        coverImageBase64: theme?.hero?.coverImageBase64 ?? null,
        subtitle: theme?.hero?.subtitle ?? '',
        layout: theme?.hero?.layout ?? 'full',
      },
    });
  };

  const handleTitleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onTitleChange(e.currentTarget.textContent ?? '');
  };

  const handleSubtitleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onThemeChange?.({
      hero: {
        ...(theme?.hero ?? { enabled: true, coverImageBase64: null, layout: 'full' }),
        subtitle: e.currentTarget.textContent ?? '',
      },
    });
  };

  const preventEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  // Style picker toolbar — hidden until parent is hovered
  const makeStylePicker = (position: 'bottom' | 'below') => (
    <div className={`absolute left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/75 backdrop-blur-sm px-2.5 py-1.5 rounded-full z-20 whitespace-nowrap pointer-events-auto ${position === 'below' ? 'top-full mt-2' : 'bottom-3'}`}>
      {COVER_STYLES.map(({ key, label }) => (
        <button
          key={key}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setStyle(key); }}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            currentStyle === key
              ? 'bg-white text-slate-900'
              : 'text-white/70 hover:text-white hover:bg-white/15'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const stylePicker = makeStylePicker('bottom');

  const titleEl = (className: string, style?: React.CSSProperties) => (
    <div
      ref={titleRefCallback}
      contentEditable
      suppressContentEditableWarning
      onInput={handleTitleInput}
      onKeyDown={preventEnter}
      data-placeholder="Document Title"
      className={`cover-editable-title ${className}`}
      style={style}
    />
  );

  const subtitleEl = (className: string, style?: React.CSSProperties) => (
    <div
      ref={subtitleRefCallback}
      contentEditable
      suppressContentEditableWarning
      onInput={handleSubtitleInput}
      onKeyDown={preventEnter}
      data-placeholder="Add a subtitle..."
      className={`cover-editable-subtitle ${className}`}
      style={style}
    />
  );

  if (currentStyle === 'none') {
    return (
      <div
        key="none"
        className="group relative mb-8"
        style={{ borderLeft: `4px solid ${primaryColor}`, paddingLeft: '1.25rem' }}
      >
        {titleEl('text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 outline-none')}
        {makeStylePicker('below')}
      </div>
    );
  }

  if (currentStyle === 'gradient') {
    return (
      <div
        key="gradient"
        className="cover-fade-in group relative mb-8 rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${darkenedPrimary})`,
          padding: '4rem 3rem',
        }}
      >
        {coverImageBase64 && (
          <img
            src={coverImageBase64}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, zIndex: 0, pointerEvents: 'none' }}
          />
        )}
        <div className="relative z-10">
          {titleEl('text-5xl font-extrabold text-white outline-none')}
          {subtitleEl('text-xl mt-3 outline-none', { color: 'rgba(255,255,255,0.8)' })}
        </div>
        {stylePicker}
      </div>
    );
  }

  if (currentStyle === 'dark') {
    return (
      <div
        key="dark"
        className="cover-fade-in group relative mb-8 rounded-xl overflow-hidden"
        style={{ background: '#0c0c11', padding: '4rem 3rem' }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            paddingLeft: '3rem', pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
          }}
        >
          <span style={{
            fontSize: '8rem', fontWeight: 900, color: primaryColor, opacity: 0.08,
            filter: 'blur(2px)', userSelect: 'none', lineHeight: 1, whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        </div>
        <div className="relative z-10">
          {titleEl('text-5xl font-black text-white outline-none')}
          {subtitleEl('text-lg mt-3 outline-none', { color: 'rgba(255,255,255,0.6)' })}
        </div>
        {stylePicker}
      </div>
    );
  }

  if (currentStyle === 'mesh') {
    return (
      <div
        key="mesh"
        className="cover-fade-in group relative mb-8 rounded-xl overflow-hidden"
        style={{ background: '#0f0c1a', padding: '4rem 3rem' }}
      >
        <style>{`
          @keyframes mesh-shift-a {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.1); }
            66% { transform: translate(-20px, 30px) scale(0.9); }
          }
          @keyframes mesh-shift-b {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-30px, 20px) scale(0.9); }
            66% { transform: translate(20px, -30px) scale(1.1); }
          }
          @keyframes mesh-shift-c {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 20px) scale(1.15); }
          }
          .cover-mesh-blob {
            position: absolute; border-radius: 50%;
            filter: blur(60px); opacity: 0.5; pointer-events: none;
          }
        `}</style>
        <div className="cover-mesh-blob" style={{ width: 300, height: 300, background: primaryColor, top: '-80px', left: '-80px', animation: 'mesh-shift-a 8s ease-in-out infinite' }} />
        <div className="cover-mesh-blob" style={{ width: 250, height: 250, background: darkenedPrimary, bottom: '-60px', right: '-60px', animation: 'mesh-shift-b 10s ease-in-out infinite' }} />
        <div className="cover-mesh-blob" style={{ width: 200, height: 200, background: `${primaryColor}88`, top: '30%', right: '20%', animation: 'mesh-shift-c 7s ease-in-out infinite' }} />
        <div className="relative z-10">
          {titleEl('text-5xl font-bold text-white outline-none')}
          {subtitleEl('text-lg mt-3 outline-none', { color: 'rgba(255,255,255,0.7)' })}
        </div>
        {stylePicker}
      </div>
    );
  }

  // editorial
  return (
    <div
      key="editorial"
      className="cover-fade-in group relative mb-8 rounded-xl"
      style={{ background: '#fffbf7', padding: '4rem 3rem', borderTop: `4px solid ${primaryColor}` }}
    >
      {titleEl('outline-none', {
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: '3.5rem',
        fontWeight: 400,
        color: '#1a1a1a',
        lineHeight: 1.15,
      })}
      {subtitleEl('outline-none mt-4', {
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: primaryColor,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      })}
      {stylePicker}
    </div>
  );
}
