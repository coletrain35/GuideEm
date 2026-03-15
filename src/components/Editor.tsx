import { EditorContent, useEditor } from '@tiptap/react';
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus';
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
import { ScrollReveal, REVEAL_TYPES } from '../extensions/ScrollReveal';
import { compressImageToWebP } from '../utils/imageCompressor';
import { useEffect, useState, useRef } from 'react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Quote, Image as ImageIcon,
  Link as LinkIcon, Highlighter, AlignLeft, AlignCenter, AlignRight, Table as TableIcon,
  Info, AlertTriangle, CheckCircle, Minus, Undo, Redo, Bold, Italic, Strikethrough, Columns,
  ChevronsUpDown, Layers, GripHorizontal, Video, Milestone, LayoutGrid, Hash,
  MessageSquareQuote, PanelTop, BarChart3, GitCompare, SplitSquareHorizontal,
  PartyPopper, Sparkles
} from 'lucide-react';

const lowlight = createLowlight(common);

interface EditorProps {
  initialContent: any;
  initialHtmlContent: string;
  initialTitle: string;
  onUpdate: (html: string, json: any, newTitle: string) => void;
}

export const Editor = ({ initialContent, initialHtmlContent, initialTitle, onUpdate }: EditorProps) => {
  const [content, setContent] = useState<any>(initialContent);
  const [htmlContent, setHtmlContent] = useState<string>(initialHtmlContent || '');
  const [title, setTitle] = useState(initialTitle);
  const [isMounted, setIsMounted] = useState(false);
  const [headings, setHeadings] = useState<{ text: string; level: number; id: string }[]>([]);

  const [showRevealPop, setShowRevealPop] = useState(false);
  const [showGradientPop, setShowGradientPop] = useState(false);
  const [gradientFrom, setGradientFrom] = useState('#6366f1');
  const [gradientTo, setGradientTo] = useState('#ec4899');
  const [gradientDir, setGradientDir] = useState('to right');
  const [showBadgePop, setShowBadgePop] = useState(false);
  const [showAnimPop, setShowAnimPop] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      }),
      AnnotatedImage,
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
      ScrollReveal,
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
  });

  if (!editor || !isMounted) {
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
    <div className="flex flex-col h-full max-w-3xl px-4 mx-auto mt-4 sm:mt-8 lg:mt-12 sm:px-6 lg:px-8 w-full">
      {/* The Floating Toolbar (The "Hovering Pill") */}
      <div className="sticky top-4 z-40 flex items-center justify-center w-full mb-8 pointer-events-none">
        <div className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-sm pointer-events-auto overflow-x-auto scrollbar-hide">
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 sm:p-2 rounded hover:bg-slate-200 disabled:opacity-50 text-slate-600" title="Undo"><Undo size={16} /></button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 sm:p-2 rounded hover:bg-slate-200 disabled:opacity-50 text-slate-600" title="Redo"><Redo size={16} /></button>
          
          <div className="w-px h-5 bg-slate-300 mx-1" />
          
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Bold"><Bold size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Italic"><Italic size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('strike') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Strikethrough"><Strikethrough size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('highlight') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Highlight"><Highlighter size={16} /></button>
          <button onClick={setLink} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('link') ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Link"><LinkIcon size={16} /></button>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Align Left"><AlignLeft size={16} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Align Center"><AlignCenter size={16} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`} title="Align Right"><AlignRight size={16} /></button>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Insert Table"><TableIcon size={16} /></button>
          <button onClick={() => editor.chain().focus().insertContent('<div data-type="grid"><div data-type="grid-column"><p></p></div><div data-type="grid-column"><p></p></div></div>').run()} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Insert 2-Column Grid"><Columns size={16} /></button>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="Horizontal Rule"><Minus size={16} /></button>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Scroll Reveal */}
          <div className="relative">
            <button
              onClick={() => setShowRevealPop(v => !v)}
              className={`p-2 rounded hover:bg-slate-200 text-slate-600 flex items-center gap-1`}
              title="Scroll Reveal Animation"
            >
              <Sparkles size={16} />
            </button>
            {showRevealPop && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-0.5" style={{ minWidth: '140px' }}>
                <p className="text-xs text-slate-500 px-2 pt-1 pb-1.5 font-medium">Reveal on scroll</p>
                {REVEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === 'none') {
                        editor.chain().focus().setScrollReveal('none').run();
                      } else {
                        editor.chain().focus().setScrollReveal(type).run();
                      }
                      setShowRevealPop(false);
                    }}
                    className="text-xs text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 capitalize"
                  >
                    {type === 'none' ? '✕ None' : type.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Guide Title"
        className="w-full text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 border-none outline-none bg-transparent placeholder:text-slate-300 mb-4 sm:mb-8"
      />

      {editor && (
        <FloatingMenu editor={editor} className="flex bg-white shadow-lg border border-slate-200 rounded-lg overflow-x-auto p-1 gap-1 max-w-[calc(100vw-2rem)] scrollbar-hide">
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Heading 1"><Heading1 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Heading 2"><Heading2 size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Heading 3"><Heading3 size={18} /></button>
          
          <div className="w-px bg-slate-200 mx-1" />
          
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Bullet List"><List size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Ordered List"><ListOrdered size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('taskList') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Task List"><CheckSquare size={18} /></button>
          
          <div className="w-px bg-slate-200 mx-1" />
          
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('codeBlock') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Code Block"><Code size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`} title="Blockquote"><Quote size={18} /></button>
          
          <div className="w-px bg-slate-200 mx-1" />

          <button onClick={() => editor.chain().focus().toggleCallout('info').run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('callout', { type: 'info' }) ? 'bg-blue-100 text-blue-600' : 'text-blue-500'}`} title="Info Callout"><Info size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleCallout('warning').run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('callout', { type: 'warning' }) ? 'bg-amber-100 text-amber-600' : 'text-amber-500'}`} title="Warning Callout"><AlertTriangle size={18} /></button>
          <button onClick={() => editor.chain().focus().toggleCallout('success').run()} className={`p-2 rounded hover:bg-slate-100 transition-colors ${editor.isActive('callout', { type: 'success' }) ? 'bg-emerald-100 text-emerald-600' : 'text-emerald-500'}`} title="Success Callout"><CheckCircle size={18} /></button>

          <div className="w-px bg-slate-200 mx-1" />

          <button onClick={() => { const url = window.prompt('URL'); if (url) { editor.chain().focus().setAnnotatedImage({ src: url }).run(); } }} className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600" title="Image URL"><ImageIcon size={18} /></button>
          <button onClick={() => editor.chain().focus().insertContent('<div data-type="grid"><div data-type="grid-column"><p></p></div><div data-type="grid-column"><p></p></div></div>').run()} className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600" title="Insert 2-Column Grid"><Columns size={18} /></button>

          <div className="w-px bg-slate-200 mx-1" />

          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'accordion', content: [{ type: 'accordionItem', attrs: { title: 'Section 1' }, content: [{ type: 'paragraph' }] }, { type: 'accordionItem', attrs: { title: 'Section 2' }, content: [{ type: 'paragraph' }] }] }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Accordion"
          >
            <ChevronsUpDown size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'tabGroup', content: [{ type: 'tabPanel', attrs: { label: 'Tab 1' }, content: [{ type: 'paragraph' }] }, { type: 'tabPanel', attrs: { label: 'Tab 2' }, content: [{ type: 'paragraph' }] }] }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Tabs"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'sectionDivider', attrs: { style: 'gradient' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Section Divider"
          >
            <GripHorizontal size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'videoEmbed', attrs: { src: '' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Video Embed"
          >
            <Video size={18} />
          </button>

          <div className="w-px bg-slate-200 mx-1" />

          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'timeline', content: [{ type: 'timelineStep', attrs: { title: 'Step 1' }, content: [{ type: 'paragraph' }] }, { type: 'timelineStep', attrs: { title: 'Step 2' }, content: [{ type: 'paragraph' }] }] }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Timeline"
          >
            <Milestone size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'cardGrid', attrs: { cols: 3 }, content: [{ type: 'card', attrs: { emoji: '🚀', title: 'Card 1' }, content: [{ type: 'paragraph' }] }, { type: 'card', attrs: { emoji: '⚡', title: 'Card 2' }, content: [{ type: 'paragraph' }] }, { type: 'card', attrs: { emoji: '🎯', title: 'Card 3' }, content: [{ type: 'paragraph' }] }] }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Card Grid"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'counter', attrs: { value: 100, prefix: '', suffix: '+', label: 'Label' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Animated Counter"
          >
            <Hash size={18} />
          </button>

          <div className="w-px bg-slate-200 mx-1" />

          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'testimonial', attrs: { quote: 'Your testimonial goes here.', authorName: 'Author Name', authorRole: 'Title, Company', avatarColor: '#6366f1' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Testimonial"
          >
            <MessageSquareQuote size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'heroBanner', attrs: { gradientFrom: '#6366f1', gradientTo: '#ec4899', title: 'Your Title Here', subtitle: '', ctaText: '', ctaUrl: '' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Hero Banner"
          >
            <PanelTop size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'statRow', attrs: { stats: JSON.stringify([{ value: '100', prefix: '', suffix: '+', label: 'Label', icon: '' }, { value: '50', prefix: '', suffix: 'k', label: 'Users', icon: '' }, { value: '99', prefix: '', suffix: '%', label: 'Uptime', icon: '' }]) } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Stat Row"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'codeDiff', attrs: { codeBefore: "// Before\nfunction hello() {\n  console.log('hello');\n}", codeAfter: "// After\nfunction hello(name) {\n  console.log(`hello, ${name}!`);\n}", language: 'javascript' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Code Diff"
          >
            <GitCompare size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'beforeAfter', attrs: { beforeImage: '', afterImage: '', sliderPosition: 50, beforeLabel: 'Before', afterLabel: 'After' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Before/After Slider"
          >
            <SplitSquareHorizontal size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().insertContent({ type: 'confetti', attrs: { message: 'Congratulations!', emoji: '🎉', colors: '["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6"]' } }).run()}
            className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-600"
            title="Insert Confetti Block"
          >
            <PartyPopper size={18} />
          </button>
        </FloatingMenu>
      )}

      {editor && (
        <BubbleMenu editor={editor} className="relative flex bg-slate-800 shadow-xl rounded-lg p-1 gap-1 max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-hide">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('bold') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Bold</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('italic') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Italic</button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('strike') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Strike</button>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('highlight') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Highlight</button>
          <button onClick={setLink} className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('link') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Link</button>
          <div className="w-px bg-slate-600 mx-1 my-1" />
          <button onClick={() => editor.chain().focus().toggleCode().run()} className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('code') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Code</button>

          <div className="w-px bg-slate-600 mx-1 my-1" />

          {/* Gradient Text */}
          <div className="relative">
            <button
              onClick={() => { setShowGradientPop(v => !v); setShowBadgePop(false); setShowAnimPop(false); }}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('gradientText') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Gradient</button>
            {showGradientPop && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-2 z-50" style={{ minWidth: '200px' }}>
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
                  setShowBadgePop(false);
                } else {
                  setShowBadgePop(v => !v);
                  setShowGradientPop(false);
                  setShowAnimPop(false);
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('textBadge') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Badge</button>
            {showBadgePop && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50">
                <p className="text-xs text-slate-600 mb-2">Badge color</p>
                <div className="flex gap-1.5">
                  {([['#6366f1', 'Indigo'], ['#16a34a', 'Green'], ['#d97706', 'Amber'], ['#dc2626', 'Red'], ['#7c3aed', 'Purple']] as const).map(([color, name]) => (
                    <button
                      key={color}
                      onClick={() => { editor.chain().focus().setTextBadge({ color }).run(); setShowBadgePop(false); }}
                      style={{ background: color }}
                      className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                      title={name}
                    />
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
                  setShowAnimPop(false);
                } else {
                  setShowAnimPop(v => !v);
                  setShowGradientPop(false);
                  setShowBadgePop(false);
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${editor.isActive('animatedText') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Animate</button>
            {showAnimPop && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50" style={{ minWidth: '140px' }}>
                <p className="text-xs text-slate-600 mb-2">Animation type</p>
                <div className="flex flex-col gap-1">
                  {(['shimmer', 'typewriter', 'fade-in-word'] as const).map(anim => (
                    <button
                      key={anim}
                      onClick={() => { editor.chain().focus().setAnimatedText({ animation: anim }).run(); setShowAnimPop(false); }}
                      className="text-xs text-left px-2 py-1 rounded hover:bg-slate-100 text-slate-700 capitalize"
                    >{anim.replace(/-/g, ' ')}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BubbleMenu>
      )}

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
