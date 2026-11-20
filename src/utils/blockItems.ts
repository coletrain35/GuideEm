import type { Editor } from '@tiptap/core';
import { TextSelection } from 'prosemirror-state';
import type { LucideIcon } from 'lucide-react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Quote,
  Image as ImageIcon, Columns, ChevronsUpDown, Layers, GripHorizontal, Video,
  Milestone, LayoutGrid, Hash, MessageSquareQuote, PanelTop, BarChart3,
  GitCompare, SplitSquareHorizontal, PartyPopper, Info, AlertTriangle,
  CheckCircle, XCircle, Minus, PaintBucket, Table2, Briefcase, GalleryHorizontal, UserCircle2,
  Cpu, Share2, Star, Monitor, Smartphone, SquareCode, Sparkles, ScrollText, PanelLeft, AppWindow,
  Megaphone, Zap, Square, Cloud, Film, ArrowLeftRight, MousePointerClick, GitMerge,
  Terminal,
} from 'lucide-react';

export type BlockCategory = 'Text' | 'Callouts' | 'Media' | 'Layout' | 'Data' | 'Showcase';

export interface BlockPreset {
  id: string;
  label: string;
  description?: string;
  accentColor?: string;
  action: (editor: Editor) => void;
}

export interface BlockItem {
  id: string;
  label: string;
  description: string;
  details?: string;
  highlights?: string[];
  presets?: BlockPreset[];
  icon: LucideIcon;
  category: BlockCategory;
  keywords: string[];
  action: (editor: Editor) => void;
}

export function openBlockGallery(detail?: { blockId?: string | null; category?: BlockCategory | 'All' }) {
  window.dispatchEvent(new CustomEvent('tiptap:open-block-gallery', { detail }));
}

function insertOrSetCallout(e: Editor, kind: 'info' | 'warning' | 'success' | 'danger') {
  const { $from, empty } = e.state.selection;
  if (empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0) {
    e.chain().focus().setCallout(kind).run();
  } else {
    e.chain().focus().insertContent({ type: 'callout', attrs: { type: kind } }).run();
  }
}

export const BLOCK_ITEMS: BlockItem[] = [
  // ── Text ──
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    details: 'Top-level section title automatically indexed in the floating document outline and exported table of contents.',
    highlights: ['In Outline & TOC', 'Shortcut: # Space'],
    icon: Heading1,
    category: 'Text',
    keywords: ['h1', 'title', 'heading'],
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    details: 'Major subsection heading for breaking long guides into clear, scannable chapters.',
    highlights: ['In Outline & TOC', 'Shortcut: ## Space'],
    icon: Heading2,
    category: 'Text',
    keywords: ['h2', 'subtitle', 'heading'],
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    details: 'Compact subheading for grouping related steps, parameters, or notes within a section.',
    highlights: ['In Outline & TOC', 'Shortcut: ### Space'],
    icon: Heading3,
    category: 'Text',
    keywords: ['h3', 'heading'],
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Unordered list',
    details: 'Clean bulleted list with support for nested sub-items and inline formatting.',
    highlights: ['Nestable', 'Shortcut: * Space'],
    icon: List,
    category: 'Text',
    keywords: ['ul', 'unordered', 'bullets'],
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Ordered list',
    details: 'Sequential numbered steps for instructions, rankings, and ordered procedures.',
    highlights: ['Auto-numbered', 'Shortcut: 1. Space'],
    icon: ListOrdered,
    category: 'Text',
    keywords: ['ol', 'ordered', 'numbers'],
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'taskList',
    label: 'Task List',
    description: 'Checklist with checkboxes',
    details: 'Interactive checklist with toggleable checkboxes for onboarding steps, launch checklists, and QA.',
    highlights: ['Interactive checkboxes', 'Shortcut: [] Space'],
    icon: CheckSquare,
    category: 'Text',
    keywords: ['todo', 'checkbox', 'checklist'],
    action: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Syntax-highlighted code',
    details: 'Dark syntax-highlighted code block with automatic language detection and copy button in exports.',
    highlights: ['Syntax highlight', 'Copy button in export'],
    icon: Code,
    category: 'Text',
    keywords: ['code', 'syntax', 'snippet', 'pre'],
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'blockquote',
    label: 'Blockquote',
    description: 'Quoted text block',
    details: 'Left-accented quotation block for highlighting key takeaways, citations, or callout remarks.',
    highlights: ['Shortcut: > Space', 'Rich formatting'],
    icon: Quote,
    category: 'Text',
    keywords: ['quote', 'blockquote', 'cite'],
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'horizontalRule',
    label: 'Horizontal Rule',
    description: 'Divider line',
    details: 'Minimal horizontal separator line to create visual breathing room between paragraphs.',
    highlights: ['Minimal', 'Clean spacing'],
    icon: Minus,
    category: 'Text',
    keywords: ['hr', 'divider', 'line', 'separator'],
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },

  // ── Callouts ──
  {
    id: 'calloutInfo',
    label: 'Info Callout',
    description: 'Blue info box',
    details: 'Soft blue notice box with an info icon and editable title—ideal for helpful tips and context.',
    highlights: ['Editable title', 'Rich inner blocks'],
    icon: Info,
    category: 'Callouts',
    keywords: ['callout', 'info', 'note', 'tip'],
    action: (e) => insertOrSetCallout(e, 'info'),
  },
  {
    id: 'calloutWarning',
    label: 'Warning Callout',
    description: 'Amber warning box',
    details: 'High-visibility amber box for caveats, prerequisites, deprecations, and rate limits.',
    highlights: ['Editable title', 'Rich inner blocks'],
    icon: AlertTriangle,
    category: 'Callouts',
    keywords: ['callout', 'warning', 'caution', 'alert'],
    action: (e) => insertOrSetCallout(e, 'warning'),
  },
  {
    id: 'calloutSuccess',
    label: 'Success Callout',
    description: 'Green success box',
    details: 'Emerald confirmation box for best practices, verified outcomes, and pro recommendations.',
    highlights: ['Editable title', 'Rich inner blocks'],
    icon: CheckCircle,
    category: 'Callouts',
    keywords: ['callout', 'success', 'done', 'check'],
    action: (e) => insertOrSetCallout(e, 'success'),
  },
  {
    id: 'calloutDanger',
    label: 'Danger Callout',
    description: 'Red danger box',
    details: 'Crimson alert container for destructive actions, breaking changes, and security warnings.',
    highlights: ['Editable title', 'Rich inner blocks'],
    icon: XCircle,
    category: 'Callouts',
    keywords: ['callout', 'danger', 'error', 'critical'],
    action: (e) => insertOrSetCallout(e, 'danger'),
  },

  // ── Media ──
  {
    id: 'mermaid',
    label: 'Diagram',
    description: 'Flowchart, sequence, Gantt — Mermaid diagrams',
    details: 'Live Mermaid diagram editor that pre-renders crisp static SVGs into exported HTML guides.',
    highlights: ['Flowcharts & Sequence', 'Pre-rendered SVG export'],
    icon: GitMerge,
    category: 'Media',
    keywords: ['diagram', 'mermaid', 'flowchart', 'sequence', 'gantt', 'chart', 'uml'],
    action: (e) => e.chain().focus().insertContent({ type: 'mermaid' }).run(),
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or drag in an image',
    details: 'Drop-in image uploader with automatic WebP compression, captions, annotations, and export lightbox.',
    highlights: ['WebP compressed', 'Lightbox & pins'],
    icon: ImageIcon,
    category: 'Media',
    keywords: ['image', 'picture', 'photo', 'img', 'upload'],
    action: (e) => e.chain().focus().insertContent({ type: 'imagePlaceholder' }).run(),
  },
  {
    id: 'videoEmbed',
    label: 'Video Embed',
    description: 'Embed a video',
    details: 'Responsive 16:9 video player supporting YouTube, Vimeo, Loom, or direct video URLs.',
    highlights: ['Responsive 16:9', 'YouTube & Vimeo'],
    icon: Video,
    category: 'Media',
    keywords: ['video', 'youtube', 'embed', 'vimeo'],
    action: (e) => e.chain().focus().insertContent({ type: 'videoEmbed', attrs: { src: '' } }).run(),
  },
  {
    id: 'codeDiff',
    label: 'Code Diff',
    description: 'Before/after code comparison',
    details: 'Side-by-side or unified diff viewer showing removed and added lines with language styling.',
    highlights: ['Before / After', 'Line diffing'],
    icon: GitCompare,
    category: 'Media',
    keywords: ['diff', 'code', 'compare', 'git'],
    action: (e) => e.chain().focus().insertContent({
      type: 'codeDiff',
      attrs: {
        codeBefore: "// Before\nfunction hello() {\n  console.log('hello');\n}",
        codeAfter: "// After\nfunction hello(name) {\n  console.log(`hello, ${name}!`);\n}",
        language: 'javascript',
      },
    }).run(),
  },
  {
    id: 'beforeAfter',
    label: 'Before / After',
    description: 'Image comparison slider',
    details: 'Draggable split-screen image comparator for UI redesigns, renders, and visual enhancements.',
    highlights: ['Interactive drag slider', 'Custom labels'],
    icon: SplitSquareHorizontal,
    category: 'Media',
    keywords: ['before', 'after', 'slider', 'compare'],
    action: (e) => e.chain().focus().insertContent({
      type: 'beforeAfter',
      attrs: { beforeImage: '', afterImage: '', sliderPosition: 50, beforeLabel: 'Before', afterLabel: 'After' },
    }).run(),
  },
  {
    id: 'interactiveDemo',
    label: 'Interactive Demo',
    description: 'Click-through image walkthrough',
    details: 'Multi-step product tour with clickable hotspots and guided captions overlaid on screenshots.',
    highlights: ['Hotspot steps', 'Self-contained tour'],
    icon: MousePointerClick,
    category: 'Media',
    keywords: ['interactive', 'demo', 'walkthrough', 'click', 'prototype', 'simulation', 'tutorial', 'clickthrough'],
    action: (e) => e.chain().focus().insertContent({ type: 'interactiveDemo' }).run(),
  },

  // ── Layout ──
  {
    id: 'grid',
    label: '2-Column Grid',
    description: 'Side-by-side columns',
    details: 'Two balanced side-by-side content columns that accept any text, callouts, lists, or media.',
    highlights: ['Nested blocks', 'Responsive stack'],
    icon: Columns,
    category: 'Layout',
    keywords: ['grid', 'columns', 'layout', 'two'],
    action: (e) => e.chain().focus().insertContent(
      '<div data-type="grid"><div data-type="grid-column"><p></p></div><div data-type="grid-column"><p></p></div></div>'
    ).run(),
  },
  {
    id: 'accordion',
    label: 'Accordion',
    description: 'Collapsible sections',
    details: 'Expandable FAQ or troubleshooting sections that keep dense details tucked neatly away.',
    highlights: ['Collapsible panels', 'Great for FAQs'],
    icon: ChevronsUpDown,
    category: 'Layout',
    keywords: ['accordion', 'collapse', 'toggle', 'expand'],
    action: (e) => e.chain().focus().insertContent({
      type: 'accordion',
      content: [
        { type: 'accordionItem', attrs: { title: 'Section 1' }, content: [{ type: 'paragraph' }] },
        { type: 'accordionItem', attrs: { title: 'Section 2' }, content: [{ type: 'paragraph' }] },
      ],
    }).run(),
  },
  {
    id: 'tabs',
    label: 'Tabs',
    description: 'Tabbed content panels',
    details: 'Interactive tab switcher—ideal for npm/yarn/pnpm install commands or multi-OS instructions.',
    highlights: ['Interactive tabs', 'Rich content inside'],
    icon: Layers,
    category: 'Layout',
    keywords: ['tabs', 'panel', 'tabbed'],
    action: (e) => e.chain().focus().insertContent({
      type: 'tabGroup',
      content: [
        { type: 'tabPanel', attrs: { label: 'Tab 1', active: true }, content: [{ type: 'paragraph' }] },
        { type: 'tabPanel', attrs: { label: 'Tab 2', active: false }, content: [{ type: 'paragraph' }] },
      ],
    }).run(),
  },
  {
    id: 'sectionDivider',
    label: 'Section Divider',
    description: 'Decorative divider',
    details: 'Stylish section separator supporting gradient, wave, dots, rainbow, and animated pulse styles.',
    highlights: ['7 visual styles', 'Gradient & wave'],
    presets: [
      {
        id: 'divider-gradient',
        label: 'Gradient',
        accentColor: '#3b82f6',
        action: (e) => e.chain().focus().insertContent({ type: 'sectionDivider', attrs: { style: 'gradient' } }).run(),
      },
      {
        id: 'divider-wave',
        label: 'Wave',
        accentColor: '#64748b',
        action: (e) => e.chain().focus().insertContent({ type: 'sectionDivider', attrs: { style: 'wave' } }).run(),
      },
      {
        id: 'divider-dots',
        label: 'Dots',
        accentColor: '#94a3b8',
        action: (e) => e.chain().focus().insertContent({ type: 'sectionDivider', attrs: { style: 'dots' } }).run(),
      },
    ],
    icon: GripHorizontal,
    category: 'Layout',
    keywords: ['divider', 'section', 'separator', 'break'],
    action: (e) => e.chain().focus().insertContent({ type: 'sectionDivider', attrs: { style: 'gradient' } }).run(),
  },
  {
    id: 'backgroundSection',
    label: 'Background Section',
    description: 'Section with colored/gradient background',
    details: 'Container block that wraps paragraphs, cards, or headings in a patterned, dark, or brand-tinted surface.',
    highlights: ['10 surface presets', 'Adjustable padding'],
    presets: [
      {
        id: 'bg-dots',
        label: 'Dot Pattern',
        accentColor: '#94a3b8',
        action: (e) => e.chain().focus().insertContent({
          type: 'backgroundSection',
          attrs: { bgPreset: 'dots', padding: 'md', borderRadius: 'md' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Featured section with a clean dot grid backdrop.' }] }],
        }).run(),
      },
      {
        id: 'bg-grid',
        label: 'Blueprint Grid',
        accentColor: '#64748b',
        action: (e) => e.chain().focus().insertContent({
          type: 'backgroundSection',
          attrs: { bgPreset: 'grid', padding: 'md', borderRadius: 'lg' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Architectural grid section for technical callouts.' }] }],
        }).run(),
      },
      {
        id: 'bg-dark',
        label: 'Dark Slate',
        accentColor: '#1e293b',
        action: (e) => e.chain().focus().insertContent({
          type: 'backgroundSection',
          attrs: { bgPreset: 'dark-slate', padding: 'lg', borderRadius: 'lg' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'High-contrast dark surface section.' }] }],
        }).run(),
      },
    ],
    icon: PaintBucket,
    category: 'Layout',
    keywords: ['background', 'section', 'gradient', 'color', 'wrapper', 'landing'],
    action: (e) => e.chain().focus().insertContent({
      type: 'backgroundSection',
      attrs: { bgPreset: 'dots', padding: 'md', borderRadius: 'md' },
      content: [{ type: 'paragraph' }],
    }).run(),
  },

  // ── Data ──
  {
    id: 'table',
    label: 'Table',
    description: 'Structured data in rows and columns',
    details: 'Resizable data table with 7 visual themes (Minimal, Striped, Dark, Accent, Bordered, Compact).',
    highlights: ['7 table styles', 'Resizable columns'],
    icon: Table2,
    category: 'Data',
    keywords: ['table', 'rows', 'columns', 'grid', 'data'],
    action: (_e) => {
      window.dispatchEvent(new CustomEvent('tiptap:open-table-modal'));
    },
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Step-by-step process',
    details: 'Vertical chronological milestone list with optional date markers and rich step descriptions.',
    highlights: ['Date labels', 'Rich inner steps'],
    icon: Milestone,
    category: 'Data',
    keywords: ['timeline', 'steps', 'process', 'milestone'],
    action: (e) => e.chain().focus().insertContent({
      type: 'timeline',
      content: [
        { type: 'timelineStep', attrs: { date: '' }, content: [
          { type: 'timelineStepTitle', content: [{ type: 'text', text: 'Step 1' }] },
          { type: 'paragraph' },
        ]},
        { type: 'timelineStep', attrs: { date: '' }, content: [
          { type: 'timelineStepTitle', content: [{ type: 'text', text: 'Step 2' }] },
          { type: 'paragraph' },
        ]},
      ],
    }).run(),
  },
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Rich process cards with icons',
    details: 'Connected step-by-step workflow cards with customizable icons, titles, and detailed explanations.',
    highlights: ['Icon step badges', 'Visual connectors'],
    icon: GitCompare,
    category: 'Data',
    keywords: ['workflow', 'process', 'steps', 'flow', 'how it works'],
    action: (e) => e.chain().focus().insertContent({
      type: 'workflow',
      content: [
        { type: 'workflowStep', attrs: { title: 'Step 1', icon: 'circle-dot' }, content: [{ type: 'paragraph' }] },
        { type: 'workflowStep', attrs: { title: 'Step 2', icon: 'zap' }, content: [{ type: 'paragraph' }] },
        { type: 'workflowStep', attrs: { title: 'Step 3', icon: 'check-circle' }, content: [{ type: 'paragraph' }] },
      ],
    }).run(),
  },
  {
    id: 'cardGrid',
    label: 'Card Grid',
    description: 'Grid of feature cards',
    details: 'Responsive 2, 3, or 4-column grid of feature cards with emoji icons, titles, and rich inner text.',
    highlights: ['2–4 columns', 'Up to 12 cards'],
    presets: [
      {
        id: 'cardgrid-3',
        label: '3-Column Features',
        accentColor: '#3b82f6',
        action: (e) => e.chain().focus().insertContent({
          type: 'cardGrid',
          attrs: { cols: 3 },
          content: [
            { type: 'card', attrs: { emoji: '🚀', title: 'Fast Setup' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start authoring in seconds.' }] }] },
            { type: 'card', attrs: { emoji: '⚡', title: 'Zero Backend' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Local-first storage & export.' }] }] },
            { type: 'card', attrs: { emoji: '🎯', title: 'Self-Contained' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Single-file HTML output.' }] }] },
          ],
        }).run(),
      },
      {
        id: 'cardgrid-2',
        label: '2-Column Comparison',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({
          type: 'cardGrid',
          attrs: { cols: 2 },
          content: [
            { type: 'card', attrs: { emoji: '✅', title: 'Recommended' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use standalone HTML export for sharing.' }] }] },
            { type: 'card', attrs: { emoji: '🛠️', title: 'Advanced' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use CLI rendering for CI pipelines.' }] }] },
          ],
        }).run(),
      },
    ],
    icon: LayoutGrid,
    category: 'Data',
    keywords: ['cards', 'grid', 'features', 'card'],
    action: (e) => e.chain().focus().insertContent({
      type: 'cardGrid',
      attrs: { cols: 3 },
      content: [
        { type: 'card', attrs: { emoji: '🚀', title: 'Card 1' }, content: [{ type: 'paragraph' }] },
        { type: 'card', attrs: { emoji: '⚡', title: 'Card 2' }, content: [{ type: 'paragraph' }] },
        { type: 'card', attrs: { emoji: '🎯', title: 'Card 3' }, content: [{ type: 'paragraph' }] },
      ],
    }).run(),
  },
  {
    id: 'counter',
    label: 'Animated Counter',
    description: 'Counting number animation',
    details: 'Bold KPI metric display that smoothly animates up to the target value when scrolled into view.',
    highlights: ['Scroll-triggered count', 'Prefix & suffix'],
    icon: Hash,
    category: 'Data',
    keywords: ['counter', 'number', 'stat', 'animate'],
    action: (e) => e.chain().focus().insertContent({
      type: 'counter',
      attrs: { value: 100, prefix: '', suffix: '+', label: 'Label' },
    }).run(),
  },
  {
    id: 'statRow',
    label: 'Stat Row',
    description: 'Row of statistics',
    details: 'Clean multi-column KPI banner highlighting 3+ key metrics side-by-side.',
    highlights: ['Multi-stat strip', 'Animated numbers'],
    icon: BarChart3,
    category: 'Data',
    keywords: ['stats', 'numbers', 'metrics', 'kpi'],
    action: (e) => e.chain().focus().insertContent({
      type: 'statRow',
      attrs: {
        stats: JSON.stringify([
          { value: '100', prefix: '', suffix: '+', label: 'Label', icon: '' },
          { value: '50', prefix: '', suffix: 'k', label: 'Users', icon: '' },
          { value: '99', prefix: '', suffix: '%', label: 'Uptime', icon: '' },
        ]),
      },
    }).run(),
  },

  // ── Showcase ──
  {
    id: 'testimonial',
    label: 'Testimonial',
    description: 'Quote with author',
    details: 'Polished customer or stakeholder quote card with customizable avatar badge, name, and role.',
    highlights: ['Inline editable', 'Custom avatar color'],
    icon: MessageSquareQuote,
    category: 'Showcase',
    keywords: ['testimonial', 'quote', 'review', 'feedback'],
    action: (e) => e.chain().focus().insertContent({
      type: 'testimonial',
      attrs: { quote: 'Your testimonial goes here.', authorName: 'Author Name', authorRole: 'Title, Company', avatarColor: '#6366f1' },
    }).run(),
  },
  {
    id: 'heroBanner',
    label: 'Hero Banner',
    description: 'Full-width gradient banner',
    details: 'Eye-catching gradient banner with large headline, subtitle, and optional CTA link button.',
    highlights: ['6 gradient presets', 'Optional CTA button'],
    presets: [
      {
        id: 'hero-indigo-pink',
        label: 'Indigo → Pink',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({
          type: 'heroBanner',
          attrs: {
            gradientFrom: '#6366f1',
            gradientTo: '#ec4899',
            title: 'Build Beautiful Docs',
            subtitle: 'Local-first authoring with standalone HTML export',
            ctaText: 'Get Started',
            ctaUrl: '',
          },
        }).run(),
      },
      {
        id: 'hero-ocean-cyan',
        label: 'Ocean Cyan',
        accentColor: '#06b6d4',
        action: (e) => e.chain().focus().insertContent({
          type: 'heroBanner',
          attrs: {
            gradientFrom: '#2563eb',
            gradientTo: '#06b6d4',
            title: 'Developer Platform v2.0',
            subtitle: 'Everything you need to ship faster',
            ctaText: 'Explore API',
            ctaUrl: '',
          },
        }).run(),
      },
      {
        id: 'hero-dark-slate',
        label: 'Dark Slate',
        accentColor: '#1e293b',
        action: (e) => e.chain().focus().insertContent({
          type: 'heroBanner',
          attrs: {
            gradientFrom: '#334155',
            gradientTo: '#0f172a',
            title: 'Enterprise Architecture',
            subtitle: 'Zero-dependency static documentation',
            ctaText: 'Read Docs',
            ctaUrl: '',
          },
        }).run(),
      },
    ],
    icon: PanelTop,
    category: 'Showcase',
    keywords: ['hero', 'banner', 'header', 'cta'],
    action: (e) => e.chain().focus().insertContent({
      type: 'heroBanner',
      attrs: { gradientFrom: '#6366f1', gradientTo: '#ec4899', title: 'Your Title Here', subtitle: '', ctaText: '', ctaUrl: '' },
    }).run(),
  },
  {
    id: 'confetti',
    label: 'Confetti Block',
    description: 'Celebration animation',
    details: 'Celebratory milestone banner that bursts colorful confetti in the editor and exported guide.',
    highlights: ['Animated burst', 'Custom emoji & message'],
    icon: PartyPopper,
    category: 'Showcase',
    keywords: ['confetti', 'celebration', 'party', 'fun'],
    action: (e) => e.chain().focus().insertContent({
      type: 'confetti',
      attrs: { message: 'Congratulations!', emoji: '🎉', colors: '["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6"]' },
    }).run(),
  },
  {
    id: 'projectCard',
    label: 'Project Card',
    description: 'Showcase a project with links and tags',
    details: 'Rich portfolio project card with cover thumbnail, tech stack tags, and live/repo buttons.',
    highlights: ['Thumbnail upload', 'Tags & links'],
    icon: Briefcase,
    category: 'Showcase',
    keywords: ['project', 'portfolio', 'card', 'work', 'showcase'],
    action: (e) => e.chain().focus().insertContent({
      type: 'projectCard',
      attrs: {
        thumbnail: '',
        title: 'Project Title',
        description: 'A short description of what this project does and why it matters.',
        tags: '[]',
        liveUrl: '',
        repoUrl: '',
        accentColor: '#6366f1',
      },
    }).run(),
  },
  {
    id: 'projectGallery',
    label: 'Project Gallery',
    description: 'Grid of project cards — 2 or 3 columns',
    details: 'Multi-column portfolio showcase displaying several projects with thumbnails, tags, and links.',
    highlights: ['2 or 3 columns', 'Portfolio ready'],
    icon: GalleryHorizontal,
    category: 'Showcase',
    keywords: ['project', 'portfolio', 'gallery', 'grid', 'cards', 'showcase'],
    action: (e) => e.chain().focus().insertContent({
      type: 'projectGallery',
      attrs: { cols: 2 },
    }).run(),
  },
  {
    id: 'aboutMe',
    label: 'About Me',
    description: 'Avatar, name, role, and bio in a split layout',
    details: 'Author bio card combining portrait avatar, headline role, and biography in a clean split layout.',
    highlights: ['Avatar upload', 'Author profile'],
    icon: UserCircle2,
    category: 'Showcase',
    keywords: ['about', 'bio', 'profile', 'avatar', 'person', 'author'],
    action: (e) => e.chain().focus().insertContent({ type: 'aboutMe', attrs: {} }).run(),
  },
  {
    id: 'techStack',
    label: 'Tech Stack',
    description: 'Icon + label grid of languages and tools',
    details: 'Structured badge grid showcasing languages, frameworks, and tools used in a project.',
    highlights: ['Customizable items', 'Compact badge grid'],
    icon: Cpu,
    category: 'Showcase',
    keywords: ['tech', 'stack', 'tools', 'skills', 'languages', 'frameworks', 'portfolio'],
    action: (e) => e.chain().focus().insertContent({ type: 'techStack', attrs: {} }).run(),
  },
  {
    id: 'socialLinks',
    label: 'Social Links',
    description: 'Row of icon links — GitHub, LinkedIn, and more',
    details: 'Clean row of social and contact pill links for GitHub, LinkedIn, X, website, or email.',
    highlights: ['Icon pills', 'Custom URLs'],
    icon: Share2,
    category: 'Showcase',
    keywords: ['social', 'links', 'github', 'linkedin', 'twitter', 'contact', 'portfolio'],
    action: (e) => e.chain().focus().insertContent({ type: 'socialLinks', attrs: {} }).run(),
  },
  {
    id: 'portfolioHero',
    label: 'Portfolio Hero',
    description: 'Full-width hero with name, tagline, and CTA buttons',
    details: 'Personal branding hero header featuring availability pill, headline, tagline, and primary CTAs.',
    highlights: ['Dual CTAs', 'Personal branding'],
    icon: Star,
    category: 'Showcase',
    keywords: ['hero', 'portfolio', 'banner', 'name', 'tagline', 'cta', 'personal', 'branding'],
    action: (e) => e.chain().focus().insertContent({ type: 'portfolioHero', attrs: {} }).run(),
  },

  // ── Premium ──
  {
    id: 'bentoGrid',
    label: 'Bento Grid',
    description: 'Asymmetric card grid (Apple/Linear style)',
    details: '3-column asymmetric mosaic where individual cells span 1–3 columns and 1–2 rows with light, dark, or accent themes.',
    highlights: ['Span 1–3 cols', 'Light / Dark / Accent'],
    presets: [
      {
        id: 'bento-classic',
        label: 'Asymmetric 4-Card',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({ type: 'bentoGrid', attrs: {} }).run(),
      },
      {
        id: 'bento-dark-spotlight',
        label: 'Dark Spotlight',
        accentColor: '#0f172a',
        action: (e) => e.chain().focus().insertContent({
          type: 'bentoGrid',
          attrs: {
            cells: JSON.stringify([
              { colSpan: 2, rowSpan: 1, title: 'Global Edge Network', description: 'Sub-10ms latency across 300+ cities worldwide.', icon: '🌐', variant: 'dark', accentColor: '#38bdf8' },
              { colSpan: 1, rowSpan: 1, title: 'Zero Config', description: 'Works out of the box.', icon: '⚡', variant: 'accent', accentColor: '#6366f1' },
              { colSpan: 3, rowSpan: 1, title: 'End-to-End Encrypted', description: 'SOC 2 Type II certified with automatic key rotation.', icon: '🔒', variant: 'default', accentColor: '#10b981' },
            ]),
          },
        }).run(),
      },
    ],
    icon: AppWindow,
    category: 'Layout',
    keywords: ['bento', 'grid', 'cards', 'asymmetric', 'apple', 'linear', 'layout'],
    action: (e) => e.chain().focus().insertContent({ type: 'bentoGrid', attrs: {} }).run(),
  },
  {
    id: 'featureSpotlight',
    label: 'Feature Spotlight',
    description: 'Large visual + title, description, and bullet points',
    details: '50/50 split showcase pairing a gradient visual or uploaded screenshot with headline, copy, and checkmarks.',
    highlights: ['Left/Right flip', 'Checklist bullets'],
    presets: [
      {
        id: 'spotlight-left',
        label: 'Visual Left',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({
          type: 'featureSpotlight',
          attrs: { layout: 'image-left' },
        }).run(),
      },
      {
        id: 'spotlight-right',
        label: 'Visual Right (Cyan)',
        accentColor: '#06b6d4',
        action: (e) => e.chain().focus().insertContent({
          type: 'featureSpotlight',
          attrs: {
            layout: 'image-right',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            accentColor: '#0284c7',
            icon: '⚡',
            title: 'Instant Export Pipeline',
          },
        }).run(),
      },
    ],
    icon: Sparkles,
    category: 'Showcase',
    keywords: ['feature', 'spotlight', 'highlight', 'split', 'hero', 'image'],
    action: (e) => e.chain().focus().insertContent({ type: 'featureSpotlight', attrs: {} }).run(),
  },
  {
    id: 'stickyScroll',
    label: 'Sticky Scroll',
    description: 'Pinned panel with scrolling steps (Stripe-style)',
    details: 'Two-column walkthrough where the visual/summary panel stays pinned while readers scroll through steps.',
    highlights: ['Sticky export behavior', 'Step-by-step flow'],
    icon: PanelLeft,
    category: 'Layout',
    keywords: ['sticky', 'scroll', 'steps', 'how it works', 'stripe', 'tutorial'],
    action: (e) => e.chain().focus().insertContent({ type: 'stickyScroll', attrs: {} }).run(),
  },
  {
    id: 'codeWindow',
    label: 'Code Window',
    description: 'macOS-style code block with traffic light dots',
    details: 'Framed macOS terminal/editor window with filename bar, line numbers, and 4 built-in color themes.',
    highlights: ['4 themes', 'Line numbers & filename'],
    presets: [
      {
        id: 'code-ts-dark',
        label: 'TypeScript (Dark)',
        accentColor: '#1e1e2e',
        action: (e) => e.chain().focus().insertContent({
          type: 'codeWindow',
          attrs: { language: 'typescript', title: 'index.ts', theme: 'dark' },
        }).run(),
      },
      {
        id: 'code-py-dracula',
        label: 'Python (Dracula)',
        accentColor: '#44475a',
        action: (e) => e.chain().focus().insertContent({
          type: 'codeWindow',
          attrs: {
            language: 'python',
            title: 'main.py',
            theme: 'dracula',
            code: 'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))',
          },
        }).run(),
      },
      {
        id: 'code-bash-nord',
        label: 'Shell (Nord)',
        accentColor: '#2e3440',
        action: (e) => e.chain().focus().insertContent({
          type: 'codeWindow',
          attrs: {
            language: 'bash',
            title: 'terminal',
            theme: 'nord',
            code: 'npm install guideem\nnpm run build -- --standalone',
          },
        }).run(),
      },
    ],
    icon: SquareCode,
    category: 'Media',
    keywords: ['code', 'window', 'macos', 'terminal', 'snippet', 'syntax'],
    action: (e) => e.chain().focus().insertContent({ type: 'codeWindow', attrs: {} }).run(),
  },
  {
    id: 'changelogTimeline',
    label: 'Changelog',
    description: 'Polished vertical timeline with version badges',
    details: 'Release notes timeline with semantic version pills, release dates, and categorized change items.',
    highlights: ['Version badges', 'Release dates'],
    icon: ScrollText,
    category: 'Data',
    keywords: ['changelog', 'timeline', 'versions', 'releases', 'history', 'updates'],
    action: (e) => e.chain().focus().insertContent({ type: 'changelogTimeline', attrs: {} }).run(),
  },
  {
    id: 'browserMockup',
    label: 'Browser Mockup',
    description: 'Screenshot inside a realistic browser chrome',
    details: 'Frames any uploaded web screenshot inside a realistic desktop browser bar with URL input.',
    highlights: ['Editable URL bar', 'Desktop chrome'],
    icon: Monitor,
    category: 'Media',
    keywords: ['browser', 'mockup', 'screenshot', 'frame', 'chrome', 'window'],
    action: (e) => e.chain().focus().insertContent({ type: 'browserMockup', attrs: {} }).run(),
  },
  {
    id: 'phoneMockup',
    label: 'Phone Mockup',
    description: 'Screenshot inside an iPhone-style phone frame',
    details: 'Frames mobile app screenshots inside a sleek iPhone bezel with Dynamic Island.',
    highlights: ['iPhone bezel', 'Mobile preview'],
    icon: Smartphone,
    category: 'Media',
    keywords: ['phone', 'mockup', 'iphone', 'mobile', 'screenshot', 'device', 'frame'],
    action: (e) => e.chain().focus().insertContent({ type: 'phoneMockup', attrs: {} }).run(),
  },

  // ── Effects ──
  {
    id: 'marquee',
    label: 'Marquee',
    description: 'Auto-scrolling infinite ticker with logos or text',
    details: 'Continuous horizontal ticker banner great for partner logos, customer badges, or live highlights.',
    highlights: ['Infinite scroll', 'Pause on hover'],
    icon: ArrowLeftRight,
    category: 'Showcase',
    keywords: ['marquee', 'ticker', 'scroll', 'infinite', 'logos', 'banner'],
    action: (e) => e.chain().focus().insertContent({ type: 'marquee', attrs: {} }).run(),
  },
  {
    id: 'glowCards',
    label: 'Glow Cards',
    description: 'Cards with hover cursor spotlight and glow',
    details: 'Interactive feature cards with a cursor-following radial spotlight and glowing border effect.',
    highlights: ['Cursor spotlight', 'White / Dark / Glass'],
    presets: [
      {
        id: 'glow-light',
        label: 'Light Spotlight',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({
          type: 'glowCards',
          attrs: { cols: 3, cardBg: 'white', textColor: 'light' },
        }).run(),
      },
      {
        id: 'glow-dark',
        label: 'Dark Neon',
        accentColor: '#0f172a',
        action: (e) => e.chain().focus().insertContent({
          type: 'glowCards',
          attrs: { cols: 3, cardBg: 'dark', textColor: 'dark' },
        }).run(),
      },
      {
        id: 'glow-glass',
        label: 'Frosted Glass (2-Col)',
        accentColor: '#94a3b8',
        action: (e) => e.chain().focus().insertContent({
          type: 'glowCards',
          attrs: { cols: 2, cardBg: 'glass', textColor: 'light' },
        }).run(),
      },
    ],
    icon: Zap,
    category: 'Showcase',
    keywords: ['glow', 'cards', 'hover', 'spotlight', 'effect', 'neon'],
    action: (e) => e.chain().focus().insertContent({ type: 'glowCards', attrs: {} }).run(),
  },
  {
    id: 'gradientBorder',
    label: 'Gradient Border',
    description: 'Block with animated cycling gradient border',
    details: 'Highlighted callout card surrounded by a smooth animated rainbow/accent gradient border.',
    highlights: ['Animated border', 'Custom accent'],
    icon: Square,
    category: 'Layout',
    keywords: ['gradient', 'border', 'animated', 'glow', 'highlight', 'frame'],
    action: (e) => e.chain().focus().insertContent({ type: 'gradientBorder', attrs: {} }).run(),
  },
  {
    id: 'hoverReveal',
    label: 'Hover Reveal',
    description: 'Cards that flip or slide to reveal content on hover',
    details: 'Interactive flashcard grid where hovering flips in 3D or slides up to reveal deeper details.',
    highlights: ['3D Flip or Slide', '2–4 columns'],
    presets: [
      {
        id: 'reveal-flip',
        label: '3D Flip Cards',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({
          type: 'hoverReveal',
          attrs: { cols: 3, revealStyle: 'flip' },
        }).run(),
      },
      {
        id: 'reveal-slide',
        label: 'Slide-Up Reveal',
        accentColor: '#10b981',
        action: (e) => e.chain().focus().insertContent({
          type: 'hoverReveal',
          attrs: { cols: 3, revealStyle: 'slide' },
        }).run(),
      },
    ],
    icon: Layers,
    category: 'Showcase',
    keywords: ['hover', 'reveal', 'flip', 'card', 'interaction', 'effect'],
    action: (e) => e.chain().focus().insertContent({ type: 'hoverReveal', attrs: {} }).run(),
  },
  {
    id: 'announcementPill',
    label: 'Announcement Pill',
    description: 'Shimmer badge banner — "New", "v2.0 just shipped"',
    details: 'Compact shimmer announcement pill for highlighting releases, betas, or breaking updates at the top of a guide.',
    highlights: ['6 color themes', 'Shimmer sweep'],
    presets: [
      {
        id: 'pill-indigo',
        label: 'Indigo Launch',
        accentColor: '#6366f1',
        action: (e) => e.chain().focus().insertContent({
          type: 'announcementPill',
          attrs: { label: 'New', message: 'Something exciting just launched', variant: 'indigo', shimmer: true },
        }).run(),
      },
      {
        id: 'pill-emerald',
        label: 'Emerald v2.0',
        accentColor: '#10b981',
        action: (e) => e.chain().focus().insertContent({
          type: 'announcementPill',
          attrs: { label: 'v2.0', message: 'Now available with instant HTML export', variant: 'emerald', shimmer: true },
        }).run(),
      },
      {
        id: 'pill-dark',
        label: 'Dark Shimmer',
        accentColor: '#0f172a',
        action: (e) => e.chain().focus().insertContent({
          type: 'announcementPill',
          attrs: { label: 'Beta', message: 'Introducing interactive documentation blocks', variant: 'dark', shimmer: true },
        }).run(),
      },
    ],
    icon: Megaphone,
    category: 'Showcase',
    keywords: ['announcement', 'pill', 'badge', 'banner', 'shimmer', 'new', 'launch'],
    action: (e) => e.chain().focus().insertContent({ type: 'announcementPill', attrs: {} }).run(),
  },
  {
    id: 'gradientBlobs',
    label: 'Gradient Blobs',
    description: 'Ambient blurred gradient orbs floating in a section',
    details: 'Atmospheric aurora backdrop with soft floating gradient spheres behind headline or section text.',
    highlights: ['Ambient aurora', 'Customizable colors'],
    icon: Cloud,
    category: 'Layout',
    keywords: ['gradient', 'blobs', 'orbs', 'ambient', 'background', 'glow', 'aurora'],
    action: (e) => e.chain().focus().insertContent({ type: 'gradientBlobs', attrs: {} }).run(),
  },
  {
    id: 'noiseOverlay',
    label: 'Noise Texture',
    description: 'Subtle film grain texture on a section background',
    details: 'Tactile film-grain surface container adding editorial depth to featured content.',
    highlights: ['Editorial grain', 'Subtle depth'],
    icon: Film,
    category: 'Layout',
    keywords: ['noise', 'grain', 'texture', 'film', 'background', 'tactile', 'depth'],
    action: (e) => e.chain().focus().insertContent({ type: 'noiseOverlay', attrs: {} }).run(),
  },
  {
    id: 'mathBlock',
    label: 'Math Formula',
    description: 'LaTeX / KaTeX mathematical equation block',
    details: 'Display-mode LaTeX math block rendered with KaTeX in both the live editor and exported HTML.',
    highlights: ['LaTeX / KaTeX', 'Clean centered math'],
    icon: Code,
    category: 'Data',
    keywords: ['math', 'latex', 'katex', 'equation', 'formula'],
    action: (e) => e.chain().focus().insertContent({ type: 'mathBlock', attrs: {} }).run(),
  },
  {
    id: 'apiEndpoint',
    label: 'API Endpoint',
    description: 'REST method badge, path, and response payload card',
    details: 'Interactive REST API card with HTTP method badge, route path, summary, status code, and dark JSON response.',
    highlights: ['GET / POST / PUT / DELETE', 'JSON payload'],
    presets: [
      {
        id: 'api-get',
        label: 'GET List',
        accentColor: '#10b981',
        action: (e) => e.chain().focus().insertContent({
          type: 'apiEndpoint',
          attrs: { method: 'GET', path: '/api/v1/users', summary: 'List active users', responseCode: '200 OK' },
        }).run(),
      },
      {
        id: 'api-post',
        label: 'POST Create',
        accentColor: '#3b82f6',
        action: (e) => e.chain().focus().insertContent({
          type: 'apiEndpoint',
          attrs: {
            method: 'POST',
            path: '/api/v1/users',
            summary: 'Create a new user account',
            responseCode: '201 Created',
            responseBody: '{\n  "id": "usr_9f8a",\n  "status": "created"\n}',
          },
        }).run(),
      },
      {
        id: 'api-delete',
        label: 'DELETE Resource',
        accentColor: '#f43f5e',
        action: (e) => e.chain().focus().insertContent({
          type: 'apiEndpoint',
          attrs: {
            method: 'DELETE',
            path: '/api/v1/users/:id',
            summary: 'Permanently delete a user',
            responseCode: '204 No Content',
            responseBody: '{\n  "deleted": true\n}',
          },
        }).run(),
      },
    ],
    icon: Terminal,
    category: 'Data',
    keywords: ['api', 'rest', 'endpoint', 'http', 'get', 'post', 'json'],
    action: (e) => e.chain().focus().insertContent({ type: 'apiEndpoint', attrs: {} }).run(),
  },
];

export const BLOCK_CATEGORIES: BlockCategory[] = ['Text', 'Callouts', 'Media', 'Layout', 'Data', 'Showcase'];

export function insertBlockAction(editor: Editor, action: (editor: Editor) => void) {
  if (!editor || editor.isDestroyed) return;
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  const isCurrentEmptyParagraph =
    selection.empty &&
    $from.parent.type.name === 'paragraph' &&
    $from.parent.content.size === 0;

  if (isCurrentEmptyParagraph) {
    editor.view.focus();
    action(editor);
  } else {
    let insertPos = selection.to;
    try {
      if ($from.depth >= 1) {
        insertPos = $from.after(1);
      }
    } catch {
      insertPos = state.doc.content.size;
    }

    const pNode = state.schema.nodes.paragraph.create();
    const tr = state.tr.insert(insertPos, pNode);
    tr.setSelection(TextSelection.create(tr.doc, Math.min(insertPos + 1, tr.doc.content.size)));
    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
    action(editor);
  }

  const { state: newState } = editor;
  const lastNode = newState.doc.lastChild;
  if (lastNode && lastNode.type.name !== 'paragraph') {
    const endPos = newState.doc.content.size;
    const tr = newState.tr.insert(endPos, newState.schema.nodes.paragraph.create());
    editor.view.dispatch(tr);
  }
  editor.view.focus();
}

export function insertBlock(editor: Editor, item: BlockItem) {
  insertBlockAction(editor, item.action);
}
