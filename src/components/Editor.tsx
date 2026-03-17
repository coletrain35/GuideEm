import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github-dark.css';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Callout } from '../extensions/Callout';
import { GradientText } from '../extensions/GradientText';
import { TextBadge } from '../extensions/TextBadge';
import { AnimatedText } from '../extensions/AnimatedText';
import { AnnotatedImage } from '../extensions/AnnotatedImage';
import { ImagePlaceholder } from '../extensions/ImagePlaceholder';
import { Grid, GridColumn } from '../extensions/Grid';
import { Accordion, AccordionItem } from '../extensions/Accordion';
import { TabGroup, TabPanel } from '../extensions/Tabs';
import { SectionDivider } from '../extensions/SectionDivider';
import { VideoEmbed } from '../extensions/VideoEmbed';
import { Timeline, TimelineStep } from '../extensions/Timeline';
import { CardGrid, Card } from '../extensions/CardGrid';
import { Counter } from '../extensions/Counter';
import { Testimonial } from '../extensions/Testimonial';
import { HeroBanner } from '../extensions/HeroBanner';
import { StatRow } from '../extensions/StatRow';
import { CodeDiff } from '../extensions/CodeDiff';
import { BeforeAfter } from '../extensions/BeforeAfter';
import { Confetti } from '../extensions/Confetti';
import { BackgroundSection } from '../extensions/BackgroundSection';
import { ScrollReveal, REVEAL_TYPES, BLOCK_TYPES } from '../extensions/ScrollReveal';
import { InlineCode, type InlineCodeLanguage } from '../extensions/InlineCode';
import { SlashCommand } from '../extensions/SlashCommand';
import { PlusMenu } from './PlusMenu';
import { compressImageToWebP } from '../utils/imageCompressor';
import { SECTION_BG_PRESETS } from '../utils/backgroundPresets';
import { useEffect, useState, useRef } from 'react';
import { DocumentCover } from './DocumentCover';
import type { ThemeConfig } from '../utils/storage';
import {
  Link as LinkIcon, Highlighter, AlignLeft, AlignCenter, AlignRight, Table as TableIcon,
  Minus, Undo, Redo, Bold, Italic, Strikethrough, Columns,
  Sparkles
} from 'lucide-react';

const lowlight = createLowlight(common);

interface EditorProps {
  initialContent: any;
  initialHtmlContent: string;
  initialTitle: string;
  onUpdate: (html: string, json: any, newTitle: string) => void;
  theme?: ThemeConfig;
  onThemeChange?: (updates: Partial<ThemeConfig>) => void;
}

export const Editor = ({ initialContent, initialHtmlContent, initialTitle, onUpdate, theme, onThemeChange }: EditorProps) => {
  const [content, setContent] = useState<any>(initialContent);
  const [htmlContent, setHtmlContent] = useState<string>(initialHtmlContent || '');
  const [title, setTitle] = useState(initialTitle);
  const [headings, setHeadings] = useState<{ text: string; level: number; id: string }[]>([]);

  const [hasSelection, setHasSelection] = useState(false);
  const [, setSelectionVersion] = useState(0);
  const [showRevealPop, setShowRevealPop] = useState(false);
  const [showGradientPop, setShowGradientPop] = useState(false);
  const [gradientFrom, setGradientFrom] = useState('#6366f1');
  const [gradientTo, setGradientTo] = useState('#ec4899');
  const [gradientDir, setGradientDir] = useState('to right');
  const [showBadgePop, setShowBadgePop] = useState(false);
  const [showAnimPop, setShowAnimPop] = useState(false);
  const [showBgPop, setShowBgPop] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      onUpdate(htmlContent, content, title);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, htmlContent, title, onUpdate]);

  const extractHeadings = (editor: any) => {
    const newHeadings: { text: string; level: number; id: string }[] = [];
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading' && (node.attrs.level === 1 || node.attrs.level === 2)) {
        newHeadings.push({
          level: node.attrs.level,
          text: node.textContent,
          id: `heading-${pos}`
        });
      }
    });
    setHeadings(newHeadings);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        code: false,
      }),
      InlineCode,
      AnnotatedImage,
      ImagePlaceholder,
      Placeholder.configure({
        placeholder: 'Type "/" for commands or start writing...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      GradientText,
      TextBadge,
      AnimatedText,
      Callout,
      Grid,
      GridColumn,
      Accordion,
      AccordionItem,
      TabGroup,
      TabPanel,
      SectionDivider,
      VideoEmbed,
      Timeline,
      TimelineStep,
      CardGrid,
      Card,
      Counter,
      Testimonial,
      HeroBanner,
      StatRow,
      CodeDiff,
      BeforeAfter,
      Confetti,
      BackgroundSection,
      ScrollReveal,
      SlashCommand,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-2xl prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md min-h-[500px] pb-32',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          
          if (file.type.startsWith('image/')) {
            event.preventDefault();

            compressImageToWebP(file)
              .then((base64) => {
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                if (coordinates) {
                  view.dispatch(
                    view.state.tr.insert(
                      coordinates.pos,
                      view.state.schema.nodes.annotatedImage.create({ src: base64 })
                    )
                  );
                }
              })
              .catch((error) => {
                console.error('Failed to compress image on drop:', error);
              });

            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          
          if (file.type.startsWith('image/')) {
            event.preventDefault();

            compressImageToWebP(file)
              .then((base64) => {
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.annotatedImage.create({ src: base64 })
                  )
                );
              })
              .catch((error) => {
                console.error('Failed to compress image on paste:', error);
              });

            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      
      setContent(json);
      setHtmlContent(html);
      extractHeadings(editor);
    },
    onCreate: ({ editor }) => {
      extractHeadings(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty);
      setSelectionVersion(v => v + 1);
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-col max-w-3xl px-4 mx-auto mt-4 sm:mt-8 lg:mt-12 sm:px-6 lg:px-8 w-full">
      {/* The Floating Toolbar (The "Hovering Pill") */}
      <div className="sticky top-4 z-40 flex items-center justify-center w-full mb-8 pointer-events-none">
        {/* Outer pill — no overflow clipping so popups can escape */}
        <div
          className="flex items-center bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-sm pointer-events-auto transition-all duration-150"
          onMouseDown={e => e.preventDefault()}
        >
          {hasSelection ? (
            <>
              {/* Scrollable simple buttons */}
              <div className="flex items-center gap-1 pl-2 sm:pl-3 py-2 overflow-x-auto scrollbar-hide">
                <select
                  value={
                    editor.isActive('heading', { level: 1 }) ? '1' :
                    editor.isActive('heading', { level: 2 }) ? '2' :
                    editor.isActive('heading', { level: 3 }) ? '3' :
                    editor.isActive('heading', { level: 4 }) ? '4' :
                    'p'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'p') {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor.chain().focus().toggleHeading({ level: parseInt(val) as 1|2|3|4 }).run();
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="text-xs bg-transparent border border-slate-200 rounded px-2 py-1 text-slate-700 cursor-pointer hover:bg-slate-100"
                >
                  <option value="p">Paragraph</option>
                  <option value="1">Heading 1</option>
                  <option value="2">Heading 2</option>
                  <option value="3">Heading 3</option>
                  <option value="4">Heading 4</option>
                </select>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Bold"><Bold size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Italic"><Italic size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('strike') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Strikethrough"><Strikethrough size={16} /></button>
                <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('highlight') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Highlight"><Highlighter size={16} /></button>
                <button onClick={setLink} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('link') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Link"><LinkIcon size={16} /></button>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                {/* Inline Code */}
                <button
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-2 rounded hover:bg-slate-200 text-xs font-mono font-bold ${editor.isActive('code') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  title="Inline Code"
                >&lt;/&gt;</button>
                {editor.isActive('code') && (
                  <select
                    value={editor.getAttributes('code').language || ''}
                    onChange={(e) => editor.chain().focus().setInlineCodeLanguage(e.target.value as InlineCodeLanguage).run()}
                    className="text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded px-1 py-1 cursor-pointer"
                  >
                    <option value="">auto</option>
                    <option value="js">JS</option>
                    <option value="ts">TS</option>
                    <option value="py">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="bash">Bash</option>
                  </select>
                )}
              </div>

              {/* Popup buttons — outside overflow container */}
              <div className="flex items-center gap-1 pr-2 sm:pr-3 py-2 shrink-0">
                <div className="w-px h-5 bg-slate-300 mx-1" />

                {/* Gradient Text */}
                <div className="relative">
                  <button
                    onClick={() => { setShowGradientPop(v => !v); setShowBadgePop(false); setShowAnimPop(false); }}
                    className={`px-2 py-1.5 text-xs font-medium rounded hover:bg-slate-200 ${editor.isActive('gradientText') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  >Gradient</button>
                  {showGradientPop && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-2 z-50" style={{ minWidth: '200px' }}>
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-slate-600">From</label>
                        <input type="color" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)} className="w-8 h-6 cursor-pointer rounded" />
                        <label className="text-xs text-slate-600">To</label>
                        <input type="color" value={gradientTo} onChange={e => setGradientTo(e.target.value)} className="w-8 h-6 cursor-pointer rounded" />
                      </div>
                      <select value={gradientDir} onChange={e => setGradientDir(e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-700">
                        <option value="to right">→ Horizontal</option>
                        <option value="to bottom">↓ Vertical</option>
                        <option value="135deg">↘ Diagonal</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { editor.chain().focus().setGradientText({ colorFrom: gradientFrom, colorTo: gradientTo, direction: gradientDir }).run(); setShowGradientPop(false); }}
                          className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700"
                        >Apply</button>
                        {editor.isActive('gradientText') && (
                          <button
                            onClick={() => { editor.chain().focus().unsetGradientText().run(); setShowGradientPop(false); }}
                            className="flex-1 text-xs bg-slate-200 text-slate-700 rounded px-2 py-1 hover:bg-slate-300"
                          >Remove</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Badge */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (editor.isActive('textBadge')) {
                        editor.chain().focus().unsetTextBadge().run();
                      } else {
                        setShowBadgePop(v => !v); setShowGradientPop(false); setShowAnimPop(false);
                      }
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded hover:bg-slate-200 ${editor.isActive('textBadge') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  >Badge</button>
                  {showBadgePop && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50">
                      <p className="text-xs text-slate-600 mb-2">Badge color</p>
                      <div className="flex gap-1.5">
                        {([['#6366f1', 'Indigo'], ['#16a34a', 'Green'], ['#d97706', 'Amber'], ['#dc2626', 'Red'], ['#7c3aed', 'Purple']] as const).map(([color, name]) => (
                          <button key={color} onClick={() => { editor.chain().focus().setTextBadge({ color }).run(); setShowBadgePop(false); }} style={{ background: color }} className="w-6 h-6 rounded-full hover:scale-110 transition-transform" title={name} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Animated Text */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (editor.isActive('animatedText')) {
                        editor.chain().focus().unsetAnimatedText().run();
                      } else {
                        setShowAnimPop(v => !v); setShowGradientPop(false); setShowBadgePop(false); setShowBgPop(false);
                      }
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded hover:bg-slate-200 ${editor.isActive('animatedText') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  >Animate</button>
                  {showAnimPop && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50" style={{ minWidth: '140px' }}>
                      <p className="text-xs text-slate-600 mb-2">Animation type</p>
                      <div className="flex flex-col gap-1">
                        {(['shimmer', 'typewriter', 'fade-in-word'] as const).map(anim => (
                          <button key={anim} onClick={() => { editor.chain().focus().setAnimatedText({ animation: anim }).run(); setShowAnimPop(false); }} className="text-xs text-left px-2 py-1 rounded hover:bg-slate-100 text-slate-700 capitalize">{anim.replace(/-/g, ' ')}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section Background */}
                <div className="relative">
                  <button
                    onClick={() => { setShowBgPop(v => !v); setShowGradientPop(false); setShowBadgePop(false); setShowAnimPop(false); }}
                    className={`px-2 py-1.5 text-xs font-medium rounded hover:bg-slate-200 ${editor.isActive('backgroundSection') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  >Section BG</button>
                  {showBgPop && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 w-56">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {editor.isActive('backgroundSection') ? 'Change Background' : 'Wrap in Background'}
                      </p>
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {SECTION_BG_PRESETS.map((p) => (
                          <div key={p.id} className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => {
                                if (editor.isActive('backgroundSection')) {
                                  editor.chain().focus().updateAttributes('backgroundSection', { bgPreset: p.id }).run();
                                } else {
                                  (editor.chain().focus() as any).setBackgroundSection({ bgPreset: p.id }).run();
                                }
                                setShowBgPop(false);
                              }}
                              title={p.name}
                              className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-105 ${
                                editor.isActive('backgroundSection') && editor.getAttributes('backgroundSection').bgPreset === p.id
                                  ? 'border-blue-500 ring-1 ring-blue-300'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                              style={{
                                backgroundColor: p.id === 'none' ? '#f1f5f9' : (p.backgroundColor || 'transparent'),
                                backgroundImage: p.backgroundImage || undefined,
                                backgroundSize: p.backgroundSize || undefined,
                              }}
                            />
                            <span className="text-[9px] text-slate-400 leading-tight text-center truncate w-full">{p.name}</span>
                          </div>
                        ))}
                      </div>
                      {editor.isActive('backgroundSection') && (
                        <button
                          onClick={() => { editor.chain().focus().lift('backgroundSection').run(); setShowBgPop(false); }}
                          className="w-full py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                        >
                          Remove Background
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Scrollable simple buttons */}
              <div className="flex items-center gap-1 pl-2 sm:pl-3 py-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 sm:p-2 rounded hover:bg-slate-200 disabled:opacity-50 text-slate-600" title="Undo"><Undo size={16} /></button>
                <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 sm:p-2 rounded hover:bg-slate-200 disabled:opacity-50 text-slate-600" title="Redo"><Redo size={16} /></button>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Align Left"><AlignLeft size={16} /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Align Center"><AlignCenter size={16} /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Align Right"><AlignRight size={16} /></button>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Insert Table"><TableIcon size={16} /></button>
                <button onClick={() => editor.chain().focus().insertContent('<div data-type="grid"><div data-type="grid-column"><p></p></div><div data-type="grid-column"><p></p></div></div>').run()} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Insert 2-Column Grid"><Columns size={16} /></button>
                <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Horizontal Rule"><Minus size={16} /></button>
              </div>

              {/* Scroll Reveal popup — outside overflow container */}
              {(() => {
                const activeReveal = BLOCK_TYPES.reduce<string | null>((found, type) => {
                  if (found) return found;
                  if (editor.isActive(type)) {
                    const val = editor.getAttributes(type).scrollReveal;
                    return val && val !== 'none' ? val : null;
                  }
                  return null;
                }, null);
                return (
                  <div className="flex items-center pr-2 sm:pr-3 py-2 shrink-0">
                    <div className="w-px h-5 bg-slate-300 mx-1" />
                    <div className="relative">
                      <button
                        onClick={() => setShowRevealPop(v => !v)}
                        className={`p-2 rounded hover:bg-slate-200 flex items-center gap-1 ${activeReveal ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                        title={activeReveal ? `Scroll reveal: ${activeReveal}` : 'Scroll Reveal Animation'}
                      >
                        <Sparkles size={16} />
                        {activeReveal && <span className="text-xs font-medium leading-none">{activeReveal.replace(/-/g, ' ')}</span>}
                      </button>
                      {showRevealPop && (
                        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-0.5" style={{ minWidth: '150px' }}>
                          <p className="text-xs text-slate-500 px-2 pt-1 pb-1.5 font-medium">Reveal on scroll</p>
                          {REVEAL_TYPES.map((type) => (
                            <button
                              key={type}
                              onClick={() => { editor.chain().focus().setScrollReveal(type).run(); setShowRevealPop(false); }}
                              className={`text-xs text-left px-2 py-1.5 rounded hover:bg-slate-100 capitalize flex items-center justify-between ${activeReveal === type ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                            >
                              <span>{type === 'none' ? 'None' : type.replace(/-/g, ' ')}</span>
                              {activeReveal === type && <span>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      <DocumentCover
        title={title}
        onTitleChange={setTitle}
        theme={theme}
        onThemeChange={onThemeChange}
      />

      {editor && <PlusMenu editor={editor} />}


      <div className="flex-1 w-full prose-li:my-0 prose-p:my-2 pb-32">
        <EditorContent editor={editor} className="prose prose-slate prose-lg max-w-none focus:outline-none" />
      </div>

      {/* Internal Table of Contents (Editor View Only) */}
      {headings.length > 0 && (
        <div className="fixed right-8 top-32 w-64 hidden xl:block">
          <div className="sticky top-32 p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 text-xs uppercase tracking-wider">Document Outline</h3>
            <nav className="flex flex-col gap-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => {
                    // Tiptap doesn't render actual IDs in its DOM easily, so we scroll to the roughly matched text
                    const elements = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2');
                    const element = Array.from(elements).find(el => el.textContent === heading.text);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`text-left text-sm hover:text-blue-600 transition-colors truncate ${
                    heading.level === 1 ? 'text-slate-700 font-medium' : 'text-slate-500 pl-4'
                  }`}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
