import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github-dark.css';
import { Link } from '@tiptap/extension-link';
import { Table, TableView } from '@tiptap/extension-table';
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
import { Timeline, TimelineStep, TimelineStepTitle } from '../extensions/Timeline';
import { Workflow, WorkflowStep } from '../extensions/Workflow';
import { CardGrid, Card } from '../extensions/CardGrid';
import { Counter } from '../extensions/Counter';
import { Testimonial } from '../extensions/Testimonial';
import { HeroBanner } from '../extensions/HeroBanner';
import { ProjectCard } from '../extensions/ProjectCard';
import { ProjectGallery } from '../extensions/ProjectGallery';
import { AboutMe } from '../extensions/AboutMe';
import { TechStack } from '../extensions/TechStack';
import { SocialLinks } from '../extensions/SocialLinks';
import { PortfolioHero } from '../extensions/PortfolioHero';
import { StatRow } from '../extensions/StatRow';
import { CodeDiff } from '../extensions/CodeDiff';
import { BeforeAfter } from '../extensions/BeforeAfter';
import { Confetti } from '../extensions/Confetti';
import { BackgroundSection } from '../extensions/BackgroundSection';
import { ScrollReveal, REVEAL_TYPES, BLOCK_TYPES } from '../extensions/ScrollReveal';
import { InlineCode, type InlineCodeLanguage } from '../extensions/InlineCode';
import { SlashCommand } from '../extensions/SlashCommand';
import { SearchReplace } from '../extensions/SearchReplace';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import type { Node as PmNode } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import { PlusMenu } from './PlusMenu';
import { compressImageToWebP } from '../utils/imageCompressor';
import { BLOCK_ITEMS } from '../utils/blockItems';
import { SECTION_BG_PRESETS } from '../utils/backgroundPresets';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DocumentCover } from './DocumentCover';
import type { ThemeConfig } from '../utils/storage';
import {
  Link as LinkIcon, Highlighter, AlignLeft, AlignCenter, AlignRight,
  Minus, Undo, Redo, Bold, Italic, Strikethrough, Columns,
  Sparkles, Rows3, Columns3, Trash2, Palette,
  Search, X as XIcon, ChevronUp, ChevronDown, List,
} from 'lucide-react';
import { TableInsertModal } from './TableInsertModal';

const lowlight = createLowlight(common);

// Inline style definitions per table style variant applied directly to <th> elements.
// Inline styles have absolute highest priority — no CSS rule can override them.
// This is the only reliable way to beat Tailwind Typography's prose color overrides.
interface ThStyles {
  color: string;
  backgroundColor: string;
  borderColor: string;
  fontSize?: string;
  textTransform?: string;
  letterSpacing?: string;
}

const TABLE_TH_STYLES: Record<string, ThStyles> = {
  default:  { backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#e2e8f0' },
  bordered: { backgroundColor: '#f1f5f9', color: '#1e293b', borderColor: '#cbd5e1' },
  minimal:  {
    backgroundColor: 'transparent', color: '#94a3b8', borderColor: '#e2e8f0',
    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
};

// Subclass of the Tiptap TableView that stamps data-table-style directly on
// the <table> DOM element (this.table) and applies inline styles to every <th>.
// Inline styles are the only way to reliably override Tailwind Typography's
// prose-slate color rules which win the cascade over any @layer'd CSS.
class StyledTableView extends TableView {
  private currentStyle: string = 'default';

  constructor(node: PmNode, cellMinWidth: number) {
    super(node, cellMinWidth);
    this.applyStyle(node);
  }

  update(node: PmNode) {
    const ok = super.update(node);
    if (ok !== false) this.applyStyle(node);
    return ok;
  }

  private applyStyle(node: PmNode) {
    this.currentStyle = (node.attrs as any).tableStyle || 'default';
    this.table.setAttribute('data-table-style', this.currentStyle);

    const styles: ThStyles = TABLE_TH_STYLES[this.currentStyle] || TABLE_TH_STYLES['default'];

    this.table.querySelectorAll('th').forEach((th) => {
      const el = th as HTMLElement;
      el.style.backgroundColor = styles.backgroundColor;
      el.style.color = styles.color;
      el.style.borderColor = styles.borderColor;
      el.style.fontSize = styles.fontSize || '';
      el.style.textTransform = styles.textTransform || '';
      el.style.letterSpacing = styles.letterSpacing || '';
    });
  }
}

const TABLE_STYLES = [
  { id: 'default',  label: 'Default',  swatch: 'bg-slate-100' },
  { id: 'bordered', label: 'Bordered', swatch: 'border-2 border-slate-400 bg-white' },
  { id: 'minimal',  label: 'Minimal',  swatch: 'border-b-2 border-slate-400 bg-white' },
] as const;

interface EditorProps {
  initialContent: any;
  initialHtmlContent: string;
  initialTitle: string;
  onUpdate: (html: string, json: any, newTitle: string) => void;
  theme?: ThemeConfig;
  onThemeChange?: (updates: Partial<ThemeConfig>) => void;
  zenMode?: boolean;
  onEditorReady?: (editor: import('@tiptap/core').Editor) => void;
}

export const Editor = ({ initialContent, initialHtmlContent, initialTitle, onUpdate, theme, onThemeChange, zenMode, onEditorReady }: EditorProps) => {
  const [content, setContent] = useState<any>(initialContent);
  const [htmlContent, setHtmlContent] = useState<string>(initialHtmlContent || '');
  const [title, setTitle] = useState(initialTitle);
  const [headings, setHeadings] = useState<{ text: string; level: number; id: string }[]>([]);
  const [wordCount, setWordCount] = useState(0);

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
  const [showTableModal, setShowTableModal] = useState(false);
  const [showTableStylePop, setShowTableStylePop] = useState(false);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplaceLine, setShowReplaceLine] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const editorRef = useRef<import('@tiptap/core').Editor | null>(null);

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

  useEffect(() => {
    const handler = () => setShowTableModal(true);
    window.addEventListener('tiptap:open-table-modal', handler);
    return () => window.removeEventListener('tiptap:open-table-modal', handler);
  }, []);

  const countWords = (editor: any) => {
    const text = editor.state.doc.textContent;
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(count);
  };

  const extractHeadings = (editor: any) => {
    const newHeadings: { text: string; level: number; id: string }[] = [];
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading' && node.attrs.level <= 3) {
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
      Table.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            tableStyle: {
              default: 'default',
              parseHTML: element => element.getAttribute('data-table-style') || 'default',
              renderHTML: attrs => ({ 'data-table-style': attrs.tableStyle }),
            },
          };
        },
      }).configure({
        resizable: true,
        View: StyledTableView,
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
      TimelineStepTitle,
      Workflow,
      WorkflowStep,
      CardGrid,
      Card,
      Counter,
      Testimonial,
      HeroBanner,
      ProjectCard,
      ProjectGallery,
      AboutMe,
      TechStack,
      SocialLinks,
      PortfolioHero,
      StatRow,
      CodeDiff,
      BeforeAfter,
      Confetti,
      BackgroundSection,
      ScrollReveal,
      SlashCommand,
      SearchReplace,
      GlobalDragHandle.configure({ dragHandleWidth: 20, scrollTreshold: 100 }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-2xl prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md min-h-[500px] pb-32',
      },
      handleKeyDown: (_view, event) => {
        if (event.ctrlKey && event.key === 'f') {
          event.preventDefault();
          setShowFindReplace(true);
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        // Block palette drop — check first
        const blockId = event.dataTransfer?.getData('application/x-block-palette');
        if (blockId) {
          event.preventDefault();
          const ed = editorRef.current;
          if (!ed) return true;

          const mouseY = event.clientY;
          const dom = view.dom;
          const children = Array.from(dom.children) as HTMLElement[];

          // Find the insertion position by matching the same before/after logic as dragover
          let insertPos: number | null = null;

          for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (mouseY < midY || i === children.length - 1) {
              // Resolve the ProseMirror position for this DOM child
              const pmPos = view.posAtDOM(children[i], 0);
              const $resolved = view.state.doc.resolve(pmPos);

              if (mouseY < midY) {
                // Insert before this block
                insertPos = $resolved.before(1);
              } else {
                // Insert after this block (last block, bottom half)
                insertPos = $resolved.after(1);
              }
              break;
            }
          }

          if (insertPos != null) {
            // Insert an empty paragraph at the target position, then place cursor in it
            const tr = view.state.tr.insert(insertPos, view.state.schema.nodes.paragraph.create());
            view.dispatch(tr);
            // The new paragraph is at insertPos; set selection inside it
            const $newPos = view.state.doc.resolve(insertPos + 1);
            const sel = TextSelection.near($newPos);
            ed.chain().focus().setTextSelection(sel.from).run();
          }

          const item = BLOCK_ITEMS.find(b => b.id === blockId);
          item?.action(ed);
          return true;
        }

        // Image file drop
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
      transformPastedHTML: (html: string) => {
        // ProseMirror collapses whitespace around block/inline boundaries, dropping spaces
        // between words. Inject a space before closing block tags so adjacent text nodes
        // always have a word boundary when the HTML is flattened into a text run.
        return html
          .replace(/(<\/(p|div|li|h[1-6]|td|th|blockquote|pre)>)/gi, ' $1')
          .replace(/(<br\s*\/?>)/gi, ' $1');
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
      countWords(editor);
    },
    onCreate: ({ editor }) => {
      extractHeadings(editor);
      countWords(editor);
      onEditorReady?.(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty);
      setSelectionVersion(v => v + 1);
    },
  });

  // Keep ref in sync for use in drop handler
  editorRef.current = editor;

  // Scroll-spy: update active heading based on scroll position, not just cursor
  useEffect(() => {
    if (!showOutline || !editor) return;

    const getScrollContainer = (): Element | null => {
      let el = editor.view.dom.parentElement;
      while (el) {
        const { overflowY } = window.getComputedStyle(el);
        if (overflowY === 'auto' || overflowY === 'scroll') return el;
        el = el.parentElement;
      }
      return null;
    };

    const updateActiveHeading = () => {
      const headingEls = Array.from(
        editor.view.dom.querySelectorAll('h1, h2, h3')
      ) as HTMLElement[];
      if (!headingEls.length) return;

      // Last heading whose top is at or above 40% of the viewport height
      const threshold = window.innerHeight * 0.4;
      let active: HTMLElement | null = null;
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top <= threshold) active = el;
        else break;
      }
      setActiveHeadingText(active ? (active.textContent ?? null) : null);
    };

    const container = getScrollContainer();
    const target = container ?? window;
    target.addEventListener('scroll', updateActiveHeading, { passive: true });
    updateActiveHeading();
    return () => target.removeEventListener('scroll', updateActiveHeading);
  }, [showOutline, editor]);

  // Clear all drop-target indicators from the editor DOM
  const clearDropTargets = useCallback(() => {
    editor?.view.dom.querySelectorAll('[data-drop-target]').forEach(el => el.removeAttribute('data-drop-target'));
  }, [editor]);

  // Dragover handler — finds nearest top-level block and shows before/after indicator
  const handleEditorDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/x-block-palette')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    if (!editor?.view) return;

    clearDropTargets();

    // Walk top-level children and find the closest block boundary
    const dom = editor.view.dom;
    const children = Array.from(dom.children) as HTMLElement[];
    if (children.length === 0) return;

    const mouseY = e.clientY;
    let closest: HTMLElement | null = null;
    let position: 'before' | 'after' = 'before';
    let minDist = Infinity;

    for (const child of children) {
      const rect = child.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // Distance to top edge of this block
      const distTop = Math.abs(mouseY - rect.top);
      // Distance to bottom edge of this block
      const distBottom = Math.abs(mouseY - rect.bottom);

      if (distTop < minDist) {
        minDist = distTop;
        closest = child;
        position = 'before';
      }
      if (distBottom < minDist) {
        minDist = distBottom;
        closest = child;
        position = 'after';
      }

      // If mouse is inside this block, pick top/bottom half
      if (mouseY >= rect.top && mouseY <= rect.bottom) {
        closest = child;
        position = mouseY < midY ? 'before' : 'after';
        break;
      }
    }

    if (closest) {
      closest.setAttribute('data-drop-target', position);
    }
  }, [editor, clearDropTargets]);

  const handleEditorDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    clearDropTargets();
  }, [clearDropTargets]);

  const handleEditorDrop = useCallback(() => {
    clearDropTargets();
  }, [clearDropTargets]);

  // Find & Replace helper functions
  const getSearchStorage = () => (editor as any)?.storage?.searchReplace;

  const triggerSearch = (term: string, caseSens: boolean) => {
    if (!editor) return;
    const s = getSearchStorage();
    if (!s) return;
    s.searchTerm = term;
    s.caseSensitive = caseSens;
    s.currentMatchIndex = 0;
    editor.view.dispatch(editor.state.tr);
  };

  const findNext = () => {
    if (!editor) return;
    const storage = getSearchStorage();
    const { matches } = storage;
    if (!matches.length) return;
    const nextIdx = (storage.currentMatchIndex + 1) % matches.length;
    storage.currentMatchIndex = nextIdx;
    const match = matches[nextIdx];
    editor.view.dispatch(
      editor.state.tr.setSelection(
        // @ts-ignore
        TextSelection.create(editor.state.doc, match.from, match.to)
      ).scrollIntoView()
    );
    editor.view.dispatch(editor.state.tr); // re-render decorations
  };

  const findPrev = () => {
    if (!editor) return;
    const storage = getSearchStorage();
    const { matches } = storage;
    if (!matches.length) return;
    const prevIdx = (storage.currentMatchIndex - 1 + matches.length) % matches.length;
    storage.currentMatchIndex = prevIdx;
    const match = matches[prevIdx];
    editor.view.dispatch(
      editor.state.tr.setSelection(
        // @ts-ignore
        TextSelection.create(editor.state.doc, match.from, match.to)
      ).scrollIntoView()
    );
    editor.view.dispatch(editor.state.tr);
  };

  const replaceCurrentMatch = () => {
    if (!editor) return;
    const storage = getSearchStorage();
    const { matches, currentMatchIndex, replaceTerm: replTerm } = storage;
    if (!matches.length) return;
    const match = matches[currentMatchIndex];
    const { tr } = editor.state;
    if (replTerm) {
      tr.replaceWith(match.from, match.to, editor.state.schema.text(replTerm));
    } else {
      tr.delete(match.from, match.to);
    }
    editor.view.dispatch(tr);
    editor.view.dispatch(editor.state.tr);
  };

  const replaceAllMatches = () => {
    if (!editor) return;
    const storage = getSearchStorage();
    const { matches } = storage;
    if (!matches.length) return;
    const replTerm = storage.replaceTerm;
    const { tr } = editor.state;
    [...matches].reverse().forEach(({ from, to }) => {
      if (replTerm) {
        tr.replaceWith(from, to, editor.state.schema.text(replTerm));
      } else {
        tr.delete(from, to);
      }
    });
    editor.view.dispatch(tr);
    editor.view.dispatch(editor.state.tr);
  };

  const closeFindReplace = () => {
    setShowFindReplace(false);
    setFindTerm('');
    setReplaceTerm('');
    if (editor) {
      const s = getSearchStorage();
      if (s) s.searchTerm = '';
      editor.view.dispatch(editor.state.tr);
    }
  };

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
    <div
      className="flex flex-col max-w-4xl px-6 mx-auto mt-4 sm:mt-8 lg:mt-12 w-full"
      onDragOver={handleEditorDragOver}
      onDragLeave={handleEditorDragLeave}
      onDrop={handleEditorDrop}
    >
      {/* The Floating Toolbar (The "Hovering Pill") */}
      <div className={`sticky top-4 z-40 flex items-center justify-center w-full mb-8 pointer-events-none transition-all duration-300 ${zenMode ? 'opacity-0 pointer-events-none' : ''}`}>
        {/* Outer pill — no overflow clipping so popups can escape */}
        <div
          className={`flex flex-col bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm pointer-events-auto transition-all duration-150 ${editor.isActive('table') ? 'rounded-xl' : 'rounded-full'}`}
          onMouseDown={e => e.preventDefault()}
        >
          {/* Table editing toolbar — shown only when cursor is inside a table */}
          {editor.isActive('table') && (
            <div className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider border-l-2 border-blue-400 pl-2 mr-1">Table</span>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button onClick={() => editor.chain().focus().addRowBefore().run()} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Add row above"><Rows3 size={14} /></button>
              <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Add row below"><Rows3 size={14} /></button>
              <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete row"><Rows3 size={14} /></button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Add column left"><Columns3 size={14} /></button>
              <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Add column right"><Columns3 size={14} /></button>
              <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete column"><Columns3 size={14} /></button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              {/* Style picker */}
              <div className="relative">
                <button
                  onClick={() => setShowTableStylePop(v => !v)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium hover:bg-slate-200 ${showTableStylePop ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  title="Table style"
                >
                  <Palette size={13} />
                  <span>Style</span>
                </button>
                {showTableStylePop && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 p-1.5 z-50 flex flex-col gap-0.5 min-w-[130px]">
                    {TABLE_STYLES.map(({ id, label, swatch }) => {
                      const active = (editor.getAttributes('table').tableStyle || 'default') === id;
                      return (
                        <button
                          key={id}
                          onClick={() => { editor.chain().focus().updateAttributes('table', { tableStyle: id }).run(); setShowTableStylePop(false); }}
                          className={`text-xs text-left px-2 py-1.5 rounded flex items-center gap-2 ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-sm flex-shrink-0 ${swatch}`} />
                          <span className="flex-1">{label}</span>
                          {active && <span className="text-blue-500 text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete table"><Trash2 size={14} /></button>
            </div>
          )}
          <div className="flex items-center">
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
                    onMouseDown={(e) => e.preventDefault()}
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
                              onMouseDown={(e) => e.preventDefault()}
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
                          onMouseDown={(e) => e.preventDefault()}
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
                    <div className="w-px h-5 bg-slate-300 mx-1" />
                    <button
                      onClick={() => setShowOutline(v => !v)}
                      className={`p-2 rounded hover:bg-slate-200 flex items-center gap-1 ${showOutline ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                      title="Toggle Document Outline"
                    >
                      <List size={16} />
                    </button>
                  </div>
                );
              })()}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={findTerm}
              autoFocus
              onChange={e => {
                setFindTerm(e.target.value);
                triggerSearch(e.target.value, caseSensitive);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.shiftKey ? findPrev() : findNext(); }
                if (e.key === 'Escape') closeFindReplace();
              }}
              placeholder="Find…"
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
            />
            {/* Match count */}
            {findTerm && (
              <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                {(() => {
                  const s = getSearchStorage();
                  return s?.matches?.length
                    ? `${(s.currentMatchIndex ?? 0) + 1}/${s.matches.length}`
                    : '0/0';
                })()}
              </span>
            )}
            {/* Case sensitive */}
            <button
              onClick={() => {
                const next = !caseSensitive;
                setCaseSensitive(next);
                triggerSearch(findTerm, next);
              }}
              className={`px-1.5 py-0.5 text-xs rounded font-mono border transition-colors ${caseSensitive ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-slate-500 border-slate-300 hover:border-slate-400'}`}
              title="Case sensitive"
            >
              Aa
            </button>
            {/* Nav */}
            <button onClick={findPrev} className="p-1 rounded hover:bg-slate-200 text-slate-500" title="Previous (Shift+Enter)"><ChevronUp size={14} /></button>
            <button onClick={findNext} className="p-1 rounded hover:bg-slate-200 text-slate-500" title="Next (Enter)"><ChevronDown size={14} /></button>
            {/* Toggle replace */}
            <button
              onClick={() => setShowReplaceLine(v => !v)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${showReplaceLine ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-slate-500 border-slate-300 hover:border-slate-400'}`}
            >Replace</button>
            {/* Close */}
            <button onClick={closeFindReplace} className="p-1 rounded hover:bg-slate-200 text-slate-500" title="Close (Esc)">
              <XIcon size={14} />
            </button>
          </div>

          {showReplaceLine && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-3.5 flex-shrink-0" />
              <input
                type="text"
                value={replaceTerm}
                onChange={e => {
                  setReplaceTerm(e.target.value);
                  if (editor) { const s = getSearchStorage(); if (s) s.replaceTerm = e.target.value; }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') replaceCurrentMatch();
                  if (e.key === 'Escape') closeFindReplace();
                }}
                placeholder="Replace with…"
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={replaceCurrentMatch}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
              >
                Replace
              </button>
              <button
                onClick={replaceAllMatches}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
              >
                Replace All
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Word count & reading time */}
      <div className="flex justify-end pt-2 pb-8 text-xs text-slate-400 select-none">
        <span>{wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'} · {Math.max(1, Math.ceil(wordCount / 200))} min read</span>
      </div>

      {/* Document Outline — toggled via outline button in toolbar */}
      {showOutline && headings.length > 0 && (
        <div className="fixed right-4 top-28 w-56 z-30 flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outline</h3>
              <button
                onClick={() => setShowOutline(false)}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <XIcon size={13} />
              </button>
            </div>
            <nav className="flex flex-col py-2 overflow-y-auto flex-1 min-h-0">
              {headings.map((heading) => {
                const isActive = activeHeadingText === heading.text;
                return (
                  <button
                    key={heading.id}
                    onClick={() => {
                      const selector = heading.level === 1 ? '.ProseMirror h1' :
                                       heading.level === 2 ? '.ProseMirror h2' : '.ProseMirror h3';
                      const elements = document.querySelectorAll(selector);
                      const element = Array.from(elements).find(el => el.textContent === heading.text);
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`text-left px-4 py-1 text-sm transition-colors truncate flex items-center gap-1.5 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 font-medium'
                        : 'hover:text-blue-600 hover:bg-slate-50 text-slate-600'
                    } ${
                      heading.level === 2 ? 'pl-6 text-xs' : heading.level === 3 ? 'pl-9 text-xs' : ''
                    }`}
                  >
                    {isActive && <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />}
                    <span className="truncate">{heading.text}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <TableInsertModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={(rows, cols, withHeaderRow) => {
          editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
          setShowTableModal(false);
        }}
      />
    </div>
  );
};
