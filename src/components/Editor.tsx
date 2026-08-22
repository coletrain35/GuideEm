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
import { InteractiveDemo } from '../extensions/InteractiveDemo';
import { Confetti } from '../extensions/Confetti';
import { BackgroundSection } from '../extensions/BackgroundSection';
import { BentoGrid } from '../extensions/BentoGrid';
import { FeatureSpotlight } from '../extensions/FeatureSpotlight';
import { StickyScroll } from '../extensions/StickyScroll';
import { CodeWindow } from '../extensions/CodeWindow';
import { ChangelogTimeline } from '../extensions/ChangelogTimeline';
import { BrowserMockup } from '../extensions/BrowserMockup';
import { PhoneMockup } from '../extensions/PhoneMockup';
import { Marquee } from '../extensions/Marquee';
import { GlowCards } from '../extensions/GlowCards';
import { GradientBorder } from '../extensions/GradientBorder';
import { HoverReveal } from '../extensions/HoverReveal';
import { AnnouncementPill } from '../extensions/AnnouncementPill';
import { GradientBlobs } from '../extensions/GradientBlobs';
import { NoiseOverlay } from '../extensions/NoiseOverlay';
import { Mermaid } from '../extensions/Mermaid';
import { ScrollReveal, REVEAL_TYPES, BLOCK_TYPES } from '../extensions/ScrollReveal';
import { InlineCode, type InlineCodeLanguage } from '../extensions/InlineCode';
import { FontSize, type FontSizeValue } from '../extensions/FontSize';
import { SlashCommand } from '../extensions/SlashCommand';
import { SearchReplace } from '../extensions/SearchReplace';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import type { Node as PmNode } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import { PlusMenu } from './PlusMenu';
import { compressImageToWebP } from '../utils/imageCompressor';
import { sanitizeHtml, sanitizeUrl } from '../utils/sanitize';
import { BLOCK_ITEMS } from '../utils/blockItems';
import { SECTION_BG_PRESETS } from '../utils/backgroundPresets';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DocumentCover } from './DocumentCover';
import type { ThemeConfig } from '../utils/storage';
import {
  Link as LinkIcon, Highlighter, AlignLeft, AlignCenter, AlignRight,
  Minus, Undo, Redo, Bold, Italic, Strikethrough, Columns,
  Sparkles, Trash2, Palette, Plus,
  Search, X as XIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, List,
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
  minimal:  { backgroundColor: 'transparent', color: '#94a3b8', borderColor: '#e2e8f0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  striped:  { backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#e2e8f0' },
  dark:     { backgroundColor: '#0f172a', color: '#f8fafc', borderColor: '#1e293b' },
  accent:   { backgroundColor: '#3b82f6', color: '#ffffff', borderColor: '#2563eb' },
  compact:  { backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#e2e8f0' },
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
  { id: 'default',  label: 'Default',  swatch: 'bg-slate-100 border border-slate-200' },
  { id: 'bordered', label: 'Bordered', swatch: 'border-2 border-slate-400 bg-white' },
  { id: 'minimal',  label: 'Minimal',  swatch: 'border-b-2 border-slate-400 bg-white' },
  { id: 'striped',  label: 'Striped',  swatch: 'bg-gradient-to-b from-slate-100 via-white to-slate-100 border border-slate-200' },
  { id: 'dark',     label: 'Dark',     swatch: 'bg-slate-900' },
  { id: 'accent',   label: 'Accent',   swatch: 'bg-blue-500' },
  { id: 'compact',  label: 'Compact',  swatch: 'bg-slate-50 border border-slate-200' },
];

interface EditorProps {
  initialContent: any;
  initialHtmlContent: string;
  initialTitle: string;
  onUpdate: (html: string, json: any, newTitle: string) => void;
  theme?: ThemeConfig;
  onThemeChange?: (updates: Partial<ThemeConfig>) => void;
  zenMode?: boolean;
  onEditorReady?: (editor: import('@tiptap/core').Editor) => void;
  /**
   * Fired whenever the debounced autosave transitions between scheduled and
   * fired.  App-level beforeunload guards should listen for this so a tab
   * closed within the 1s debounce window still warns the user (and doesn't
   * silently drop the most recent keystroke).
   */
  onPendingChange?: (pending: boolean) => void;
}

export const Editor = ({ initialContent, initialHtmlContent, initialTitle, onUpdate, theme, onThemeChange, zenMode, onEditorReady, onPendingChange }: EditorProps) => {
  const [content, setContent] = useState<any>(initialContent);
  const [htmlContent, setHtmlContent] = useState<string>(initialHtmlContent || '');
  const [title, setTitle] = useState(initialTitle);
  const [headings, setHeadings] = useState<{ text: string; level: number; id: string; pos?: number }[]>([]);
  const [wordCount, setWordCount] = useState(0);

  const [hasSelection, setHasSelection] = useState(false);
  const [inTable, setInTable] = useState(false);
  const [, setSelectionVersion] = useState(0);
  const [activePopover, setActivePopover] = useState<'gradient' | 'badge' | 'anim' | 'bg' | 'tableStyle' | 'reveal' | 'link' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const popoverContainerRef = useRef<HTMLDivElement>(null);
  const [gradientFrom, setGradientFrom] = useState('#6366f1');
  const [gradientTo, setGradientTo] = useState('#ec4899');
  const [gradientDir, setGradientDir] = useState('to right');
  const [showTableModal, setShowTableModal] = useState(false);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplaceLine, setShowReplaceLine] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null);
  const [editorNotice, setEditorNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  // Close active popover on click outside or Escape
  useEffect(() => {
    if (!activePopover) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverContainerRef.current && !popoverContainerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activePopover]);

  // Surface inline feedback for things the editor would otherwise swallow
  // (rejected file drops, failed image uploads).  Auto-dismisses after 4s.
  const showEditorNotice = useCallback((kind: 'error' | 'info', text: string) => {
    setEditorNotice({ kind, text });
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setEditorNotice(null);
      noticeTimerRef.current = null;
    }, 4000);
  }, []);

  const isFirstRender = useRef(true);
  const editorRef = useRef<import('@tiptap/core').Editor | null>(null);
  const hasPendingSave = useRef(false);
  const latestSaveArgs = useRef({ html: htmlContent, json: content, t: title, fn: onUpdate });

  // Keep latest args current so the unmount flush always uses the most recent values.
  useEffect(() => {
    latestSaveArgs.current = { html: htmlContent, json: content, t: title, fn: onUpdate };
  });

  // Flush any pending debounced save when the Editor unmounts (e.g. user switches docs).
  useEffect(() => {
    return () => {
      if (hasPendingSave.current) {
        const { html, json, t, fn } = latestSaveArgs.current;
        fn(html, json, t);
      }
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    hasPendingSave.current = true;
    onPendingChange?.(true);
    const timeoutId = setTimeout(() => {
      hasPendingSave.current = false;
      onPendingChange?.(false);
      onUpdate(htmlContent, content, title);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, htmlContent, title, onUpdate, onPendingChange]);

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
    const newHeadings: { text: string; level: number; id: string; pos: number }[] = [];
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading' && node.attrs.level <= 3) {
        newHeadings.push({
          level: node.attrs.level,
          text: node.textContent,
          id: `heading-${pos}`,
          pos,
        });
      }
    });
    setHeadings(newHeadings);
  };

  // Strip node types that are no longer registered (e.g. removed extensions)
  const KNOWN_NODES = new Set([
    'doc','text','paragraph','heading','blockquote','bulletList','orderedList','listItem',
    'taskList','taskItem','codeBlock','horizontalRule','hardBreak','image','table','tableRow',
    'tableCell','tableHeader',
    // custom extensions
    'callout','annotatedImage','imagePlaceholder','grid','gridColumn','accordion','accordionItem',
    'tabGroup','tabPanel','sectionDivider','videoEmbed','timeline','timelineStep','timelineStepTitle',
    'workflow','workflowStep','cardGrid','card','counter','testimonial','heroBanner',
    'projectCard','projectGallery','aboutMe','techStack','socialLinks','portfolioHero',
    'statRow','codeDiff','beforeAfter','confetti','backgroundSection','bentoGrid',
    'featureSpotlight','stickyScroll','codeWindow','changelogTimeline','browserMockup',
    'phoneMockup','marquee','glowCards','gradientBorder','hoverReveal','announcementPill',
    'gradientBlobs','noiseOverlay','scrollReveal','interactiveDemo','mermaid',
  ]);
  const stripUnknownNodes = (node: any): any => {
    if (!node || typeof node !== 'object') return node;
    if (node.type && !KNOWN_NODES.has(node.type)) return null;
    if (node.content && Array.isArray(node.content)) {
      node = { ...node, content: node.content.map(stripUnknownNodes).filter(Boolean) };
    }
    return node;
  };
  const sanitizedContent = initialContent && typeof initialContent === 'object'
    ? stripUnknownNodes(initialContent)
    : (typeof initialContent === 'string' ? sanitizeHtml(initialContent) : initialContent);

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
      InteractiveDemo,
      Confetti,
      BackgroundSection,
      BentoGrid,
      FeatureSpotlight,
      StickyScroll,
      CodeWindow,
      ChangelogTimeline,
      BrowserMockup,
      PhoneMockup,
      Marquee,
      GlowCards,
      GradientBorder,
      HoverReveal,
      AnnouncementPill,
      GradientBlobs,
      NoiseOverlay,
      Mermaid,
      ScrollReveal,
      SlashCommand,
      SearchReplace,
      FontSize,
      GlobalDragHandle.configure({ dragHandleWidth: 20, scrollTreshold: 100 }),
    ],
    content: sanitizedContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md min-h-[500px] pb-32',
        'aria-label': 'Document editor. Use slash command or block palette to insert blocks.',
        'role': 'textbox',
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

        // File drop — always intercept so the browser doesn't navigate to the
        // file (which would replace the editor URL and destroy unsaved work).
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          event.preventDefault();

          if (file.type.startsWith('image/')) {
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
                } else {
                  showEditorNotice('error', 'Could not place image at the drop position.');
                }
              })
              .catch((error) => {
                console.error('Failed to compress image on drop:', error);
                showEditorNotice('error', `Image upload failed: ${error?.message || 'unknown error'}`);
              });

            return true;
          }

          showEditorNotice('error', `Only image files can be dropped here (got ${file.type || 'unknown type'}).`);
          return true;
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
          event.preventDefault();

          if (file.type.startsWith('image/')) {
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
                showEditorNotice('error', `Image upload failed: ${error?.message || 'unknown error'}`);
              });

            return true;
          }

          showEditorNotice('error', `Only image files can be pasted here (got ${file.type || 'unknown type'}).`);
          return true;
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
      setInTable(editor.isActive('tableCell') || editor.isActive('tableHeader'));
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
    let rafId: number | null = null;
    const throttledUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateActiveHeading();
        rafId = null;
      });
    };
    target.addEventListener('scroll', throttledUpdate, { passive: true });
    updateActiveHeading();
    return () => {
      target.removeEventListener('scroll', throttledUpdate);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
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

  const openLinkPopover = () => {
    const currentHref = editor.getAttributes('link').href || '';
    setLinkUrl(currentHref);
    setActivePopover(activePopover === 'link' ? null : 'link');
  };

  const applyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const safe = sanitizeUrl(linkUrl);
      if (safe) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run();
      }
    }
    setActivePopover(null);
  };

  return (
    <div
      className="flex flex-col max-w-4xl px-6 mx-auto mt-4 sm:mt-8 lg:mt-12 w-full"
      onDragOver={handleEditorDragOver}
      onDragLeave={handleEditorDragLeave}
      onDrop={handleEditorDrop}
    >
      {editorNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-3 px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
            editorNotice.kind === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {editorNotice.text}
        </div>
      )}
      {/* The Floating Toolbar (The "Hovering Pill") */}
      <div className={`sticky top-4 z-40 flex items-center justify-center w-full mb-8 pointer-events-none transition-all duration-300 ${zenMode ? 'opacity-0 pointer-events-none' : ''}`}>
        {/* Outer pill — no overflow clipping so popups can escape */}
        <div
          ref={popoverContainerRef}
          className={`flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg pointer-events-auto transition-all duration-150 ${inTable ? 'rounded-2xl' : 'rounded-full'} max-w-full`}
          onMouseDown={e => e.preventDefault()}
          role="toolbar"
          aria-label="Text formatting"
          aria-orientation="horizontal"
        >
          {/* Table editing toolbar — shown only when cursor is inside a table */}
          {inTable && (
            <div className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 border-b border-slate-100 overflow-x-auto scrollbar-hide">
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider border-l-2 border-blue-400 pl-2 mr-1">Table</span>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              {/* Row actions */}
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-0.5 select-none">Row</span>
              <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium hover:bg-slate-100 text-slate-600" title="Add row above">
                <Plus size={10} /><ChevronUp size={10} />
              </button>
              <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium hover:bg-slate-100 text-slate-600" title="Add row below">
                <Plus size={10} /><ChevronDown size={10} />
              </button>
              <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium hover:bg-red-50 text-red-400" title="Delete row">
                <Minus size={10} />Row
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              {/* Column actions */}
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-0.5 select-none">Col</span>
              <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium hover:bg-slate-100 text-slate-600" title="Add column left">
                <Plus size={10} /><ChevronLeft size={10} />
              </button>
              <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium hover:bg-slate-100 text-slate-600" title="Add column right">
                <Plus size={10} /><ChevronRight size={10} />
              </button>
              <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium hover:bg-red-50 text-red-400" title="Delete column">
                <Minus size={10} />Col
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              {/* Style picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'tableStyle' ? null : 'tableStyle')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium hover:bg-slate-200 ${activePopover === 'tableStyle' ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
                  title="Table style"
                >
                  <Palette size={13} />
                  <span>{TABLE_STYLES.find(s => s.id === (editor.getAttributes('table').tableStyle || 'default'))?.label ?? 'Style'}</span>
                </button>
                {activePopover === 'tableStyle' && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-1.5 z-50 grid grid-cols-2 gap-0.5 w-[200px]">
                    {TABLE_STYLES.map(({ id, label, swatch }) => {
                      const active = (editor.getAttributes('table').tableStyle || 'default') === id;
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => { editor.chain().focus().updateAttributes('table', { tableStyle: id }).run(); setActivePopover(null); }}
                          className={`text-xs text-left px-2 py-1.5 rounded flex items-center gap-2 ${active ? 'bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-300' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          <span className={`w-4 h-4 rounded-sm flex-shrink-0 ${swatch}`} />
                          <span className="flex-1 truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete table"><Trash2 size={14} /></button>
            </div>
          )}

          <div className="flex items-center px-2 sm:px-3 py-1.5 gap-0.5 overflow-x-auto scrollbar-hide">
            {/* History */}
            <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors" title="Undo"><Undo size={15} /></button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors" title="Redo"><Redo size={15} /></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* Block Format (Heading / Paragraph) */}
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
              className="text-xs bg-transparent border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer hover:bg-slate-100"
            >
              <option value="p">Text</option>
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
              <option value="4">H4</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center gap-0.5 border border-slate-200 rounded px-0.5 py-0.5">
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().setFontSize('small' as FontSizeValue).run(); }}
                className={`px-1 py-0.5 rounded leading-none font-medium hover:bg-slate-200 ${editor.isActive('fontSize', { size: 'small' }) ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-500'}`}
                style={{ fontSize: '10px' }}
                title="Small text"
              >A</button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetFontSize().run(); }}
                className="px-1 py-0.5 rounded leading-none font-medium hover:bg-slate-200 text-slate-500"
                style={{ fontSize: '12px' }}
                title="Normal text"
              >A</button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().setFontSize('large' as FontSizeValue).run(); }}
                className={`px-1 py-0.5 rounded leading-none font-medium hover:bg-slate-200 ${editor.isActive('fontSize', { size: 'large' }) ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-500'}`}
                style={{ fontSize: '15px' }}
                title="Large text"
              >A</button>
            </div>

            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* Formatting */}
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive('bold') ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`} title="Bold"><Bold size={15} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive('italic') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`} title="Italic"><Italic size={15} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive('strike') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`} title="Strikethrough"><Strikethrough size={15} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive('highlight') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`} title="Highlight"><Highlighter size={15} /></button>

            {/* Link Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={openLinkPopover}
                className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive('link') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                title="Insert / edit link"
              >
                <LinkIcon size={15} />
              </button>
              {activePopover === 'link' && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-50 flex flex-col gap-2 w-72"
                >
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hyperlink URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyLink();
                      }
                    }}
                    placeholder="https://example.com"
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    {editor.isActive('link') && (
                      <button
                        type="button"
                        onClick={() => {
                          editor.chain().focus().extendMarkRange('link').unsetLink().run();
                          setActivePopover(null);
                        }}
                        className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded"
                      >
                        Unlink
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActivePopover(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyLink}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inline Code */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded hover:bg-slate-100 text-xs font-mono font-bold ${editor.isActive('code') ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
              title="Inline Code"
            >&lt;/&gt;</button>

            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* Text Alignment — ALWAYS ACCESSIBLE */}
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
              title="Align Left"
            >
              <AlignLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
              title="Align Center"
            >
              <AlignCenter size={15} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-1.5 rounded hover:bg-slate-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
              title="Align Right"
            >
              <AlignRight size={15} />
            </button>

            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* Gradient Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'gradient' ? null : 'gradient')}
                className={`px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 ${editor.isActive('gradientText') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'}`}
              >
                Gradient
              </button>
              {activePopover === 'gradient' && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-3 flex flex-col gap-2 z-50 w-52"
                >
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
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().setGradientText({ colorFrom: gradientFrom, colorTo: gradientTo, direction: gradientDir }).run(); setActivePopover(null); }}
                      className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700"
                    >Apply</button>
                    {editor.isActive('gradientText') && (
                      <button
                        type="button"
                        onClick={() => { editor.chain().focus().unsetGradientText().run(); setActivePopover(null); }}
                        className="flex-1 text-xs bg-slate-100 text-slate-700 rounded px-2 py-1 hover:bg-slate-200"
                      >Remove</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Badge Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (editor.isActive('textBadge')) {
                    editor.chain().focus().unsetTextBadge().run();
                  } else {
                    setActivePopover(activePopover === 'badge' ? null : 'badge');
                  }
                }}
                className={`px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 ${editor.isActive('textBadge') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'}`}
              >
                Badge
              </button>
              {activePopover === 'badge' && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 w-48"
                >
                  <p className="text-xs font-medium text-slate-600 mb-2">Badge color</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {([['#6366f1', 'Indigo'], ['#16a34a', 'Green'], ['#d97706', 'Amber'], ['#dc2626', 'Red'], ['#7c3aed', 'Purple']] as const).map(([color, name]) => (
                      <button key={color} type="button" onClick={() => { editor.chain().focus().setTextBadge({ color }).run(); setActivePopover(null); }} style={{ background: color }} className="w-6 h-6 rounded-full hover:scale-110 transition-transform" title={name} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Animate Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (editor.isActive('animatedText')) {
                    editor.chain().focus().unsetAnimatedText().run();
                  } else {
                    setActivePopover(activePopover === 'anim' ? null : 'anim');
                  }
                }}
                className={`px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 ${editor.isActive('animatedText') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'}`}
              >
                Animate
              </button>
              {activePopover === 'anim' && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 w-40 flex flex-col gap-0.5"
                >
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Animation</p>
                  {(['shimmer', 'typewriter', 'fade-in-word'] as const).map(anim => (
                    <button key={anim} type="button" onClick={() => { editor.chain().focus().setAnimatedText({ animation: anim }).run(); setActivePopover(null); }} className="text-xs text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 capitalize">{anim.replace(/-/g, ' ')}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Section Background Popover */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActivePopover(activePopover === 'bg' ? null : 'bg')}
                className={`px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 ${editor.isActive('backgroundSection') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600'}`}
              >
                Section BG
              </button>
              {activePopover === 'bg' && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 w-56"
                >
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {editor.isActive('backgroundSection') ? 'Change Background' : 'Wrap in Background'}
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {SECTION_BG_PRESETS.map((p) => (
                      <div key={p.id} className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (editor.isActive('backgroundSection')) {
                              editor.chain().focus().updateAttributes('backgroundSection', { bgPreset: p.id }).run();
                            } else {
                              (editor.chain().focus() as any).setBackgroundSection({ bgPreset: p.id }).run();
                            }
                            setActivePopover(null);
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
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { editor.chain().focus().lift('backgroundSection').run(); setActivePopover(null); }}
                      className="w-full py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                    >
                      Remove Background
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* Scroll Reveal Popover */}
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'reveal' ? null : 'reveal')}
                    className={`p-1.5 rounded hover:bg-slate-100 flex items-center gap-1 ${activeReveal ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                    title={activeReveal ? `Scroll reveal: ${activeReveal}` : 'Scroll Reveal Animation'}
                  >
                    <Sparkles size={15} />
                  </button>
                  {activePopover === 'reveal' && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-0.5 w-40"
                    >
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Reveal on scroll</p>
                      {REVEAL_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { editor.chain().focus().setScrollReveal(type).run(); setActivePopover(null); }}
                          className={`text-xs text-left px-2 py-1.5 rounded hover:bg-slate-100 capitalize flex items-center justify-between ${activeReveal === type ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                        >
                          <span>{type === 'none' ? 'None' : type.replace(/-/g, ' ')}</span>
                          {activeReveal === type && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Outline Toggle */}
            <button
              type="button"
              onClick={() => setShowOutline(v => !v)}
              className={`p-1.5 rounded hover:bg-slate-100 flex items-center ${showOutline ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
              title="Toggle Document Outline"
            >
              <List size={15} />
            </button>
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

      {/* Document Outline — toggled via outline button in toolbar.
          Hidden below lg breakpoint to stop it from overlaying the editor on
          phones.  The floating toolbar's outline button still works, but has
          no visible effect on mobile (this matches the no-mobile-outline
          pattern that other nav features use). */}
      {showOutline && headings.length > 0 && (
        <div className="hidden lg:flex fixed right-4 top-28 w-56 z-30 flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
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
                      try {
                        const dom = editor.view.domAtPos(heading.pos + 1).node;
                        const target = dom instanceof HTMLElement ? dom : (dom as Node).parentElement;
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          return;
                        }
                      } catch { /* fallback */ }
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
