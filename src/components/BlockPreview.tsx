import React from 'react';
import { Sparkles, ArrowRight, Check, Play, Lock, Globe, Terminal } from 'lucide-react';
import type { BlockItem, BlockPreset } from '../utils/blockItems';

interface BlockPreviewGraphicProps {
  blockId: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BlockPreviewGraphic: React.FC<BlockPreviewGraphicProps> = ({ blockId, size = 'md' }) => {
  const heightClass = size === 'sm' ? 'h-20' : size === 'lg' ? 'h-32' : 'h-28';

  const renderGraphic = (): React.ReactNode => {
    switch (blockId) {
      // ── Text ──
      case 'heading1':
        return (
          <div className="w-full space-y-1.5 text-left">
            <div className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">Section Heading</div>
            <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
            <div className="h-1.5 w-1/2 rounded-full bg-slate-100" />
          </div>
        );
      case 'heading2':
        return (
          <div className="w-full space-y-1.5 text-left">
            <div className="text-sm font-bold tracking-tight text-slate-800 leading-none">Subsection Title</div>
            <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
            <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
          </div>
        );
      case 'heading3':
        return (
          <div className="w-full space-y-1.5 text-left">
            <div className="text-xs font-semibold text-slate-700 leading-none">Group Subheading</div>
            <div className="h-1.5 w-full rounded-full bg-slate-200" />
            <div className="h-1.5 w-3/5 rounded-full bg-slate-100" />
          </div>
        );
      case 'bulletList':
        return (
          <div className="w-full space-y-1.5 text-[10px] text-slate-600">
            {['First key point', 'Nested detail item', 'Final takeaway'].map((txt, i) => (
              <div key={i} className={`flex items-center gap-2 ${i === 1 ? 'pl-3' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'border border-slate-400' : 'bg-blue-500'}`} />
                <span className="truncate">{txt}</span>
              </div>
            ))}
          </div>
        );
      case 'orderedList':
        return (
          <div className="w-full space-y-1.5 text-[10px] text-slate-600">
            {['Install dependencies', 'Configure guide theme', 'Export standalone HTML'].map((txt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="truncate">{txt}</span>
              </div>
            ))}
          </div>
        );
      case 'taskList':
        return (
          <div className="w-full space-y-1.5 text-[10px]">
            <div className="flex items-center gap-2 text-slate-400 line-through">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Check size={9} strokeWidth={3} />
              </span>
              <span>Draft overview</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white shrink-0" />
              <span>Add visual diagrams</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white shrink-0" />
              <span>Publish guide</span>
            </div>
          </div>
        );
      case 'codeBlock':
        return (
          <div className="w-full rounded-lg bg-slate-900 p-2.5 font-mono text-[9px] leading-relaxed text-slate-200 shadow-inner">
            <div><span className="text-purple-400">const</span> <span className="text-sky-300">exportGuide</span> = () =&gt; {'{'}</div>
            <div className="pl-3"><span className="text-purple-400">return</span> <span className="text-emerald-300">&apos;index.html&apos;</span>;</div>
            <div>{'}'};</div>
          </div>
        );
      case 'blockquote':
        return (
          <div className="w-full border-l-3 border-blue-500 pl-3 py-1 bg-slate-50/70 rounded-r">
            <p className="text-[11px] italic text-slate-700 leading-snug">
              &ldquo;Great documentation turns complex workflows into effortless intuition.&rdquo;
            </p>
          </div>
        );
      case 'horizontalRule':
        return (
          <div className="w-full space-y-2.5">
            <div className="h-1.5 w-3/4 bg-slate-200 rounded-full" />
            <div className="h-px w-full bg-slate-300" />
            <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
          </div>
        );

      // ── Callouts ──
      case 'calloutInfo':
        return (
          <div className="w-full rounded-lg border border-blue-200 bg-blue-50/90 p-2.5 flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">i</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-blue-900">Helpful Note</div>
              <div className="text-[9px] text-blue-700 leading-tight mt-0.5">All assets inline cleanly on export.</div>
            </div>
          </div>
        );
      case 'calloutWarning':
        return (
          <div className="w-full rounded-lg border border-amber-200 bg-amber-50/90 p-2.5 flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">!</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-900">Heads Up</div>
              <div className="text-[9px] text-amber-700 leading-tight mt-0.5">Check API rate limits before scaling.</div>
            </div>
          </div>
        );
      case 'calloutSuccess':
        return (
          <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50/90 p-2.5 flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-emerald-900">Recommended</div>
              <div className="text-[9px] text-emerald-700 leading-tight mt-0.5">Configuration verified and ready.</div>
            </div>
          </div>
        );
      case 'calloutDanger':
        return (
          <div className="w-full rounded-lg border border-rose-200 bg-rose-50/90 p-2.5 flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">×</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-rose-900">Danger Zone</div>
              <div className="text-[9px] text-rose-700 leading-tight mt-0.5">This action cannot be undone.</div>
            </div>
          </div>
        );

      // ── Media ──
      case 'mermaid':
        return (
          <div className="w-full flex items-center justify-center gap-1.5 text-[9px] font-semibold">
            <div className="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">Client</div>
            <ArrowRight size={11} className="text-slate-400" />
            <div className="px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 rotate-0">Auth?</div>
            <ArrowRight size={11} className="text-slate-400" />
            <div className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">API</div>
          </div>
        );
      case 'image':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-gradient-to-br from-sky-100 via-indigo-50 to-emerald-50 p-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-amber-300/80 absolute top-2 right-4" />
            <svg viewBox="0 0 80 34" className="w-20 h-9 text-indigo-400/80">
              <path d="M4 32 L26 10 L44 26 L58 14 L76 32 Z" fill="currentColor" />
            </svg>
            <span className="text-[8px] text-slate-500 font-medium bg-white/80 px-2 py-0.5 rounded-full">WebP · Lightbox</span>
          </div>
        );
      case 'videoEmbed':
        return (
          <div className="w-full h-full rounded-lg bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-md">
              <Play size={13} fill="currentColor" className="ml-0.5" />
            </div>
            <div className="absolute bottom-2 inset-x-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-2/5 h-full bg-rose-500 rounded-full" />
            </div>
          </div>
        );
      case 'codeDiff':
        return (
          <div className="w-full rounded-lg bg-slate-900 overflow-hidden font-mono text-[8.5px] border border-slate-800">
            <div className="px-2 py-1 bg-rose-950/70 text-rose-300 border-l-2 border-rose-500">- timeout: 3000</div>
            <div className="px-2 py-1 bg-emerald-950/70 text-emerald-300 border-l-2 border-emerald-500">+ timeout: 10000</div>
            <div className="px-2 py-1 text-slate-400">  retries: 3</div>
          </div>
        );
      case 'beforeAfter':
        return (
          <div className="w-full h-full rounded-lg border border-slate-200 relative overflow-hidden flex">
            <div className="w-1/2 bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">Before</div>
            <div className="w-1/2 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">After</div>
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white shadow flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow text-[8px] flex items-center justify-center text-slate-600 font-bold">↔</div>
            </div>
          </div>
        );
      case 'interactiveDemo':
        return (
          <div className="w-full h-full rounded-lg border border-slate-200 bg-white p-2 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="h-1.5 w-12 bg-slate-100 rounded-full ml-1" />
            </div>
            <div className="flex items-center justify-center my-1 relative">
              <div className="w-16 h-6 rounded bg-indigo-50 border border-indigo-200" />
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center ring-4 ring-blue-200">
                1
              </span>
            </div>
            <div className="text-[8px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded self-center">
              Step 1/4: Click to explore
            </div>
          </div>
        );
      case 'codeWindow':
        return (
          <div className="w-full rounded-lg overflow-hidden border border-slate-700 bg-[#1e1e2e] shadow-sm">
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#313244]">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#f38ba8]" />
                <span className="w-2 h-2 rounded-full bg-[#f9e2af]" />
                <span className="w-2 h-2 rounded-full bg-[#a6e3a1]" />
              </div>
              <span className="text-[8px] font-mono text-slate-300">index.ts</span>
              <span className="text-[8px] font-mono text-slate-500">ts</span>
            </div>
            <div className="p-2 font-mono text-[8.5px] leading-relaxed text-[#cdd6f4]">
              <div><span className="text-[#cba6f7]">const</span> greet = (n) =&gt; <span className="text-[#a6e3a1]">&apos;Hi!&apos;</span>;</div>
              <div className="text-slate-400">console.log(greet(<span className="text-[#fab387]">&apos;World&apos;</span>));</div>
            </div>
          </div>
        );
      case 'browserMockup':
        return (
          <div className="w-full h-full rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border-b border-slate-200">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 bg-white rounded px-1.5 py-0.5 text-[7.5px] text-slate-400 truncate border border-slate-200">
                https://yourapp.dev
              </div>
            </div>
            <div className="flex-1 p-2 flex flex-col justify-center gap-1 bg-gradient-to-br from-slate-50 to-blue-50/40">
              <div className="h-2 w-2/3 bg-indigo-500/20 rounded" />
              <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
            </div>
          </div>
        );
      case 'phoneMockup':
        return (
          <div className="w-14 h-full rounded-2xl border-[3px] border-slate-800 bg-white shadow-sm flex flex-col items-center p-1.5 justify-between">
            <div className="w-5 h-1 rounded-full bg-slate-800" />
            <div className="w-full space-y-1 flex-1 flex flex-col justify-center">
              <div className="h-4 rounded bg-indigo-500/90" />
              <div className="h-2 rounded bg-slate-100" />
              <div className="h-2 rounded bg-slate-100 w-3/4" />
            </div>
            <div className="w-4 h-0.5 rounded-full bg-slate-300" />
          </div>
        );

      // ── Layout ──
      case 'grid':
        return (
          <div className="w-full grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-2 space-y-1">
              <div className="h-1.5 w-2/3 bg-slate-300 rounded" />
              <div className="h-1.5 w-full bg-slate-100 rounded" />
            </div>
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-2 space-y-1">
              <div className="h-1.5 w-2/3 bg-slate-300 rounded" />
              <div className="h-1.5 w-full bg-slate-100 rounded" />
            </div>
          </div>
        );
      case 'accordion':
        return (
          <div className="w-full space-y-1">
            <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
              <div className="flex items-center justify-between text-[9px] font-semibold text-slate-700">
                <span>How does export work?</span>
                <span className="text-slate-400">▾</span>
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5">Bundles CSS &amp; SVG inline.</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-2 py-1 flex items-center justify-between text-[9px] font-medium text-slate-500">
              <span>Offline support</span>
              <span>▸</span>
            </div>
          </div>
        );
      case 'tabs':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 px-1.5 pt-1 gap-1 text-[8.5px]">
              <span className="px-2 py-0.5 rounded-t bg-white border border-b-0 border-slate-200 font-semibold text-blue-600">npm</span>
              <span className="px-2 py-0.5 text-slate-500">pnpm</span>
              <span className="px-2 py-0.5 text-slate-500">yarn</span>
            </div>
            <div className="p-2 font-mono text-[8.5px] text-slate-600">npm install guideem</div>
          </div>
        );
      case 'sectionDivider':
        return (
          <div className="w-full space-y-3 flex flex-col justify-center">
            <div className="h-0.5 w-full rounded-full" style={{ background: 'linear-gradient(to right, transparent, #3b82f6, transparent)' }} />
            <div className="flex items-center justify-center gap-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        );
      case 'backgroundSection':
        return (
          <div
            className="w-full h-full rounded-lg border border-slate-200 p-2.5 flex flex-col justify-center gap-1"
            style={{
              backgroundColor: '#ffffff',
              backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          >
            <div className="bg-white/90 rounded px-2 py-1 border border-slate-100 shadow-2xs">
              <div className="text-[9px] font-bold text-slate-800">Section Backdrop</div>
              <div className="text-[8px] text-slate-500">Dots, grid, dark, or brand tint</div>
            </div>
          </div>
        );
      case 'bentoGrid':
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-1.5">
            <div className="col-span-2 rounded-lg bg-indigo-600 text-white p-1.5 flex flex-col justify-between">
              <span className="text-[10px]">🚀</span>
              <span className="text-[8px] font-bold leading-none">Ship faster</span>
            </div>
            <div className="row-span-2 rounded-lg bg-slate-900 text-white p-1.5 flex flex-col justify-between">
              <span className="text-[10px]">⚡</span>
              <span className="text-[8px] font-bold leading-none">99.9%</span>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 p-1.5 flex items-end">
              <span className="text-[7.5px] font-semibold text-slate-700">Stats</span>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 p-1.5 flex items-end">
              <span className="text-[7.5px] font-semibold text-slate-700">Secure</span>
            </div>
          </div>
        );
      case 'stickyScroll':
        return (
          <div className="w-full h-full grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 flex flex-col justify-center">
              <span className="text-[7px] uppercase tracking-wider opacity-75">Pinned</span>
              <span className="text-[9.5px] font-bold leading-tight">How it works</span>
            </div>
            <div className="space-y-1 flex flex-col justify-center">
              <div className="rounded bg-white border border-indigo-200 px-1.5 py-1 text-[8px] font-semibold text-slate-700">1. Write</div>
              <div className="rounded bg-white border border-slate-200 px-1.5 py-1 text-[8px] text-slate-500">2. Preview</div>
              <div className="rounded bg-white border border-slate-200 px-1.5 py-1 text-[8px] text-slate-500">3. Export</div>
            </div>
          </div>
        );
      case 'gradientBorder':
        return (
          <div className="w-full rounded-xl p-[2px] bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 shadow-xs">
            <div className="rounded-[10px] bg-white p-2.5 text-left">
              <div className="text-[9.5px] font-bold text-slate-800">Highlighted Card</div>
              <div className="text-[8px] text-slate-500">Animated cycling gradient ring</div>
            </div>
          </div>
        );
      case 'gradientBlobs':
        return (
          <div className="w-full h-full rounded-lg border border-slate-200 bg-white relative overflow-hidden flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-indigo-400/40 blur-md absolute -top-3 -left-2" />
            <div className="w-16 h-16 rounded-full bg-pink-400/40 blur-md absolute -bottom-3 -right-2" />
            <span className="relative text-[9.5px] font-bold text-slate-800">Ambient Aurora</span>
          </div>
        );
      case 'noiseOverlay':
        return (
          <div
            className="w-full h-full rounded-lg border border-slate-200 bg-slate-100 p-2.5 flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(rgba(15,23,42,0.12) 1px, transparent 0)',
              backgroundSize: '4px 4px',
            }}
          >
            <span className="px-2.5 py-1 rounded-md bg-white/85 text-[9px] font-semibold text-slate-700 shadow-2xs">
              Film Grain Surface
            </span>
          </div>
        );

      // ── Data ──
      case 'table':
        return (
          <div className="w-full rounded-md border border-slate-200 overflow-hidden bg-white text-[8px]">
            <div className="grid grid-cols-3 bg-slate-800 text-white font-semibold px-2 py-1">
              <span>Plan</span><span>Users</span><span>Price</span>
            </div>
            <div className="grid grid-cols-3 px-2 py-1 border-b border-slate-100 text-slate-600">
              <span>Starter</span><span>5</span><span>$0</span>
            </div>
            <div className="grid grid-cols-3 px-2 py-1 bg-slate-50/70 text-slate-600">
              <span>Pro</span><span>50</span><span>$29</span>
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="w-full space-y-1.5 pl-1">
            {[
              { title: 'Step 1 · Draft', active: true },
              { title: 'Step 2 · Review', active: false },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full mt-0.5 ${s.active ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-slate-300'}`} />
                  {i === 0 && <span className="w-px h-3 bg-slate-200 my-0.5" />}
                </div>
                <div className="text-[9px] font-semibold text-slate-700 leading-tight">{s.title}</div>
              </div>
            ))}
          </div>
        );
      case 'workflow':
        return (
          <div className="w-full flex items-center gap-1">
            {[
              { step: '1', label: 'Plan', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
              { step: '2', label: 'Build', color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { step: '3', label: 'Ship', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ].map((item, idx) => (
              <React.Fragment key={item.step}>
                <div className={`flex-1 rounded-md border p-1.5 text-center ${item.color}`}>
                  <div className="text-[8px] font-bold">{item.step}</div>
                  <div className="text-[8.5px] font-semibold">{item.label}</div>
                </div>
                {idx < 2 && <ArrowRight size={10} className="text-slate-300 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        );
      case 'cardGrid':
        return (
          <div className="w-full grid grid-cols-3 gap-1.5">
            {[
              { emoji: '🚀', label: 'Fast' },
              { emoji: '⚡', label: 'Local' },
              { emoji: '🎯', label: 'Clean' },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-1.5 text-center shadow-2xs">
                <div className="text-xs">{c.emoji}</div>
                <div className="text-[8.5px] font-semibold text-slate-700 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
        );
      case 'counter':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-center">
            <div className="text-xl font-extrabold text-indigo-600 tabular-nums leading-none">100+</div>
            <div className="text-[9px] text-slate-500 font-medium mt-1">Active Deployments</div>
          </div>
        );
      case 'statRow':
        return (
          <div className="w-full grid grid-cols-3 gap-1.5">
            {[
              { val: '100+', label: 'Guides' },
              { val: '50k', label: 'Users' },
              { val: '99.9%', label: 'Uptime' },
            ].map((st) => (
              <div key={st.label} className="rounded-md border border-slate-200 bg-white py-1.5 px-1 text-center">
                <div className="text-xs font-extrabold text-slate-900 leading-none">{st.val}</div>
                <div className="text-[7.5px] text-slate-400 mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>
        );
      case 'changelogTimeline':
        return (
          <div className="w-full space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[8px] font-bold">v2.4.0</span>
              <span className="text-[8px] text-slate-400">Nov 2026</span>
            </div>
            <div className="pl-2 border-l-2 border-indigo-200 space-y-1 text-[8.5px] text-slate-600">
              <div className="flex items-center gap-1">
                <span className="px-1 rounded bg-emerald-100 text-emerald-700 text-[7px] font-bold">NEW</span>
                <span className="truncate">Visual Block Gallery</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1 rounded bg-blue-100 text-blue-700 text-[7px] font-bold">FIX</span>
                <span className="truncate">SVG export fidelity</span>
              </div>
            </div>
          </div>
        );
      case 'mathBlock':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-center">
            <span className="font-serif italic text-sm text-slate-800">
              &int;<sub>0</sub><sup>&infin;</sup> e<sup>&minus;x&sup2;</sup> dx = &radic;&pi; / 2
            </span>
          </div>
        );
      case 'apiEndpoint':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white overflow-hidden text-left">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border-b border-slate-200">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[7.5px] font-bold">GET</span>
              <span className="font-mono text-[8px] font-semibold text-slate-700 truncate">/api/v1/resources</span>
            </div>
            <div className="bg-slate-900 px-2 py-1.5 font-mono text-[8px] text-emerald-300">
              {'{ "ok": true, "items": [...] }'}
            </div>
          </div>
        );

      // ── Showcase ──
      case 'testimonial':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white p-2.5 space-y-1.5">
            <p className="text-[9px] italic text-slate-700 leading-snug">&ldquo;Cleanest doc authoring flow we have used.&rdquo;</p>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center">A</span>
              <span className="text-[8px] font-semibold text-slate-800">Alex Rivera · VP Eng</span>
            </div>
          </div>
        );
      case 'heroBanner':
        return (
          <div
            className="w-full h-full rounded-lg p-2.5 flex flex-col items-center justify-center text-center gap-1 text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            <div className="text-xs font-extrabold leading-tight">Build Beautiful Docs</div>
            <div className="text-[8px] text-white/85">Standalone HTML export</div>
            <span className="mt-0.5 px-2.5 py-0.5 rounded-full border border-white/60 text-[8px] font-semibold">
              Get Started
            </span>
          </div>
        );
      case 'confetti':
        return (
          <div className="w-full h-full rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-pink-50 flex flex-col items-center justify-center relative overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-2 left-4" />
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 absolute top-3 right-5" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-2 left-7" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-3 right-6" />
            <div className="text-base leading-none">🎉</div>
            <div className="text-[9.5px] font-bold text-slate-800 mt-1">Congratulations!</div>
          </div>
        );
      case 'projectCard':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="h-6 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="p-2 flex items-center justify-between">
              <div>
                <div className="text-[9.5px] font-bold text-slate-800">GuideEm CLI</div>
                <div className="flex gap-1 mt-0.5">
                  <span className="px-1 rounded bg-slate-100 text-[7px] text-slate-600">TS</span>
                  <span className="px-1 rounded bg-slate-100 text-[7px] text-slate-600">React</span>
                </div>
              </div>
              <span className="text-[8px] font-semibold text-indigo-600">Live ↗</span>
            </div>
          </div>
        );
      case 'projectGallery':
        return (
          <div className="w-full grid grid-cols-2 gap-1.5">
            {['from-indigo-500 to-blue-500', 'from-emerald-500 to-teal-500'].map((grad, idx) => (
              <div key={idx} className="rounded-md border border-slate-200 bg-white overflow-hidden">
                <div className={`h-6 bg-gradient-to-r ${grad}`} />
                <div className="p-1.5">
                  <div className="h-1.5 w-3/4 bg-slate-700 rounded" />
                  <div className="h-1 w-1/2 bg-slate-200 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'aboutMe':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white p-2 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              JD
            </div>
            <div className="min-w-0">
              <div className="text-[9.5px] font-bold text-slate-800">Jordan Doe</div>
              <div className="text-[8px] text-indigo-600 font-medium">Staff Engineer</div>
              <div className="h-1.5 w-20 bg-slate-200 rounded mt-1" />
            </div>
          </div>
        );
      case 'techStack':
        return (
          <div className="w-full grid grid-cols-4 gap-1">
            {['TS', 'React', 'Node', 'CSS'].map((tech) => (
              <div key={tech} className="rounded-md border border-slate-200 bg-white py-1.5 text-center text-[8px] font-bold text-slate-700">
                {tech}
              </div>
            ))}
          </div>
        );
      case 'socialLinks':
        return (
          <div className="w-full flex items-center justify-center gap-1.5 flex-wrap">
            {[
              { label: 'GitHub', icon: <Terminal size={9} /> },
              { label: 'Website', icon: <Globe size={9} /> },
              { label: 'Security', icon: <Lock size={9} /> },
            ].map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 bg-white text-[8px] font-medium text-slate-700">
                {s.icon}
                {s.label}
              </span>
            ))}
          </div>
        );
      case 'portfolioHero':
        return (
          <div className="w-full h-full rounded-lg bg-slate-900 text-white p-2.5 flex flex-col items-center justify-center text-center gap-1">
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[7px] font-semibold">Available for work</span>
            <div className="text-xs font-bold leading-none">Hi, I&apos;m Alex</div>
            <div className="flex gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-[7.5px] font-semibold">Projects</span>
              <span className="px-2 py-0.5 rounded border border-white/30 text-[7.5px]">Contact</span>
            </div>
          </div>
        );
      case 'featureSpotlight':
        return (
          <div className="w-full h-full grid grid-cols-2 gap-2 items-center">
            <div className="h-full rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
              🚀
            </div>
            <div className="space-y-1 text-left">
              <div className="text-[9.5px] font-bold text-slate-800 leading-tight">Spotlight</div>
              <div className="flex items-center gap-1 text-[8px] text-slate-600">
                <span className="w-3 h-3 rounded-full bg-indigo-600 text-white text-[7px] flex items-center justify-center">✓</span>
                Fast export
              </div>
              <div className="flex items-center gap-1 text-[8px] text-slate-600">
                <span className="w-3 h-3 rounded-full bg-indigo-600 text-white text-[7px] flex items-center justify-center">✓</span>
                Zero config
              </div>
            </div>
          </div>
        );
      case 'marquee':
        return (
          <div className="w-full rounded-lg border border-slate-200 bg-white py-2 px-1.5 overflow-hidden">
            <div className="flex items-center justify-center gap-1.5">
              {['Acme', 'Linear', 'Vercel', 'Stripe'].map((brand) => (
                <span key={brand} className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-semibold text-slate-600 shrink-0">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        );
      case 'glowCards':
        return (
          <div className="w-full grid grid-cols-3 gap-1.5">
            {[
              { emoji: '⚡', glow: 'shadow-[0_0_12px_rgba(250,204,21,0.35)] border-amber-300/70' },
              { emoji: '🔒', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.35)] border-indigo-300/70' },
              { emoji: '🚀', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)] border-rose-300/70' },
            ].map((c, idx) => (
              <div key={idx} className={`rounded-lg bg-slate-900 border ${c.glow} p-1.5 text-center`}>
                <div className="text-xs">{c.emoji}</div>
                <div className="h-1 w-4/5 mx-auto bg-slate-600 rounded mt-1" />
              </div>
            ))}
          </div>
        );
      case 'hoverReveal':
        return (
          <div className="w-full grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2 text-center">
              <div className="text-xs">🚀</div>
              <div className="text-[8px] font-semibold text-slate-700">Front</div>
            </div>
            <div className="rounded-lg bg-indigo-600 text-white p-2 flex items-center justify-center text-center">
              <span className="text-[7.5px] leading-tight font-medium">Revealed details on hover</span>
            </div>
          </div>
        );
      case 'announcementPill':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8.5px] font-medium shadow-2xs">
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[7.5px] font-bold">New</span>
            <span className="truncate">v2.0 just shipped →</span>
          </div>
        );

      default:
        return (
          <div className="text-xs text-slate-400 font-medium">{blockId}</div>
        );
    }
  };

  return (
    <div className={`w-full ${heightClass} rounded-xl bg-slate-100/80 border border-slate-200/80 p-3 flex items-center justify-center overflow-hidden select-none`}>
      {renderGraphic()}
    </div>
  );
};

interface BlockFlyoutCardProps {
  item: BlockItem;
  onSelectDefault: (item: BlockItem) => void;
  onSelectPreset: (item: BlockItem, preset: BlockPreset) => void;
  onOpenGallery?: (item: BlockItem) => void;
  compact?: boolean;
}

export const BlockFlyoutCard: React.FC<BlockFlyoutCardProps> = ({
  item,
  onSelectDefault,
  onSelectPreset,
  onOpenGallery,
  compact = false,
}) => {
  const Icon = item.icon;

  return (
    <div className={`flex flex-col justify-between h-full min-h-0 ${compact ? 'p-3 gap-2' : 'p-3.5 gap-3'}`}>
      <div className={`${compact ? 'space-y-2 flex-1 min-h-0 overflow-y-auto pr-0.5' : 'space-y-2.5'}`}>
        {/* Visual Preview */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectDefault(item)}
          className="w-full text-left group/prev rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`Insert ${item.label}`}
        >
          <div className="transition-transform duration-150 group-hover/prev:scale-[1.01]">
            <BlockPreviewGraphic blockId={item.id} size={compact ? 'sm' : 'md'} />
          </div>
        </button>

        {/* Title & Category */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon size={14} className="text-blue-600 shrink-0" />
              <span className="text-sm font-semibold text-slate-900 truncate">{item.label}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] font-semibold text-slate-600 shrink-0">
              {item.category}
            </span>
          </div>
          <p className={`text-xs text-slate-500 leading-relaxed mt-1 ${compact ? 'line-clamp-2' : ''}`}>
            {item.details || item.description}
          </p>
        </div>

        {/* Capability Tags */}
        {item.highlights && item.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.highlights.map((h) => (
              <span
                key={h}
                className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-600"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Quick Starter Presets */}
        {item.presets && item.presets.length > 0 && (
          <div className="pt-1.5 border-t border-slate-200/80 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Starter Presets
            </div>
            <div className="flex flex-wrap gap-1">
              {item.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectPreset(item, preset)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] font-medium text-slate-700 hover:text-blue-700 transition-colors shadow-2xs"
                >
                  {preset.accentColor && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  )}
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectDefault(item)}
          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          Insert
        </button>
        {onOpenGallery && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onOpenGallery(item)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Sparkles size={11} />
            <span>Open in Gallery →</span>
          </button>
        )}
      </div>
    </div>
  );
};
