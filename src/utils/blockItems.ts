import type { Editor } from '@tiptap/core';
import type { LucideIcon } from 'lucide-react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Quote,
  Image as ImageIcon, Columns, ChevronsUpDown, Layers, GripHorizontal, Video,
  Milestone, LayoutGrid, Hash, MessageSquareQuote, PanelTop, BarChart3,
  GitCompare, SplitSquareHorizontal, PartyPopper, Info, AlertTriangle,
  CheckCircle, Glasses, Minus, PaintBucket, Table2, Briefcase, GalleryHorizontal, UserCircle2,
  Cpu, Share2, Star,
} from 'lucide-react';

export type BlockCategory = 'Text' | 'Callouts' | 'Media' | 'Layout' | 'Data' | 'Showcase';

export interface BlockItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: BlockCategory;
  keywords: string[];
  action: (editor: Editor) => void;
}

export const BLOCK_ITEMS: BlockItem[] = [
  // ── Text ──
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    category: 'Text',
    keywords: ['h1', 'title', 'heading'],
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    category: 'Text',
    keywords: ['h2', 'subtitle', 'heading'],
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    category: 'Text',
    keywords: ['h3', 'heading'],
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: List,
    category: 'Text',
    keywords: ['ul', 'unordered', 'bullets'],
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Ordered list',
    icon: ListOrdered,
    category: 'Text',
    keywords: ['ol', 'ordered', 'numbers'],
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'taskList',
    label: 'Task List',
    description: 'Checklist with checkboxes',
    icon: CheckSquare,
    category: 'Text',
    keywords: ['todo', 'checkbox', 'checklist'],
    action: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Syntax-highlighted code',
    icon: Code,
    category: 'Text',
    keywords: ['code', 'syntax', 'snippet', 'pre'],
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'blockquote',
    label: 'Blockquote',
    description: 'Quoted text block',
    icon: Quote,
    category: 'Text',
    keywords: ['quote', 'blockquote', 'cite'],
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'horizontalRule',
    label: 'Horizontal Rule',
    description: 'Divider line',
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
    icon: Info,
    category: 'Callouts',
    keywords: ['callout', 'info', 'note', 'tip'],
    action: (e) => e.chain().focus().toggleCallout('info').run(),
  },
  {
    id: 'calloutWarning',
    label: 'Warning Callout',
    description: 'Amber warning box',
    icon: AlertTriangle,
    category: 'Callouts',
    keywords: ['callout', 'warning', 'caution', 'alert'],
    action: (e) => e.chain().focus().toggleCallout('warning').run(),
  },
  {
    id: 'calloutSuccess',
    label: 'Success Callout',
    description: 'Green success box',
    icon: CheckCircle,
    category: 'Callouts',
    keywords: ['callout', 'success', 'done', 'check'],
    action: (e) => e.chain().focus().toggleCallout('success').run(),
  },
  {
    id: 'calloutGlassInfo',
    label: 'Glass Info',
    description: 'Frosted glass info box',
    icon: Glasses,
    category: 'Callouts',
    keywords: ['callout', 'glass', 'info', 'frosted'],
    action: (e) => e.chain().focus().toggleCallout('glass-info').run(),
  },
  {
    id: 'calloutGlassWarning',
    label: 'Glass Warning',
    description: 'Frosted glass warning box',
    icon: Glasses,
    category: 'Callouts',
    keywords: ['callout', 'glass', 'warning', 'frosted'],
    action: (e) => e.chain().focus().toggleCallout('glass-warning').run(),
  },
  {
    id: 'calloutGlassSuccess',
    label: 'Glass Success',
    description: 'Frosted glass success box',
    icon: Glasses,
    category: 'Callouts',
    keywords: ['callout', 'glass', 'success', 'frosted'],
    action: (e) => e.chain().focus().toggleCallout('glass-success').run(),
  },

  // ── Media ──
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or drag in an image',
    icon: ImageIcon,
    category: 'Media',
    keywords: ['image', 'picture', 'photo', 'img', 'upload'],
    action: (e) => e.chain().focus().insertContent({ type: 'imagePlaceholder' }).run(),
  },
  {
    id: 'videoEmbed',
    label: 'Video Embed',
    description: 'Embed a video',
    icon: Video,
    category: 'Media',
    keywords: ['video', 'youtube', 'embed', 'vimeo'],
    action: (e) => e.chain().focus().insertContent({ type: 'videoEmbed', attrs: { src: '' } }).run(),
  },
  {
    id: 'codeDiff',
    label: 'Code Diff',
    description: 'Before/after code comparison',
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
    icon: SplitSquareHorizontal,
    category: 'Media',
    keywords: ['before', 'after', 'slider', 'compare'],
    action: (e) => e.chain().focus().insertContent({
      type: 'beforeAfter',
      attrs: { beforeImage: '', afterImage: '', sliderPosition: 50, beforeLabel: 'Before', afterLabel: 'After' },
    }).run(),
  },

  // ── Layout ──
  {
    id: 'grid',
    label: '2-Column Grid',
    description: 'Side-by-side columns',
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
    icon: Layers,
    category: 'Layout',
    keywords: ['tabs', 'panel', 'tabbed'],
    action: (e) => e.chain().focus().insertContent({
      type: 'tabGroup',
      content: [
        { type: 'tabPanel', attrs: { label: 'Tab 1' }, content: [{ type: 'paragraph' }] },
        { type: 'tabPanel', attrs: { label: 'Tab 2' }, content: [{ type: 'paragraph' }] },
      ],
    }).run(),
  },
  {
    id: 'sectionDivider',
    label: 'Section Divider',
    description: 'Decorative divider',
    icon: GripHorizontal,
    category: 'Layout',
    keywords: ['divider', 'section', 'separator', 'break'],
    action: (e) => e.chain().focus().insertContent({ type: 'sectionDivider', attrs: { style: 'gradient' } }).run(),
  },
  {
    id: 'backgroundSection',
    label: 'Background Section',
    description: 'Section with colored/gradient background',
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
    icon: UserCircle2,
    category: 'Showcase',
    keywords: ['about', 'bio', 'profile', 'avatar', 'person', 'author'],
    action: (e) => e.chain().focus().insertContent({ type: 'aboutMe', attrs: {} }).run(),
  },
  {
    id: 'techStack',
    label: 'Tech Stack',
    description: 'Icon + label grid of languages and tools',
    icon: Cpu,
    category: 'Showcase',
    keywords: ['tech', 'stack', 'tools', 'skills', 'languages', 'frameworks', 'portfolio'],
    action: (e) => e.chain().focus().insertContent({ type: 'techStack', attrs: {} }).run(),
  },
  {
    id: 'socialLinks',
    label: 'Social Links',
    description: 'Row of icon links — GitHub, LinkedIn, and more',
    icon: Share2,
    category: 'Showcase',
    keywords: ['social', 'links', 'github', 'linkedin', 'twitter', 'contact', 'portfolio'],
    action: (e) => e.chain().focus().insertContent({ type: 'socialLinks', attrs: {} }).run(),
  },
  {
    id: 'portfolioHero',
    label: 'Portfolio Hero',
    description: 'Full-width hero with name, tagline, and CTA buttons',
    icon: Star,
    category: 'Showcase',
    keywords: ['hero', 'portfolio', 'banner', 'name', 'tagline', 'cta', 'personal', 'branding'],
    action: (e) => e.chain().focus().insertContent({ type: 'portfolioHero', attrs: {} }).run(),
  },
];

export const BLOCK_CATEGORIES: BlockCategory[] = ['Text', 'Callouts', 'Media', 'Layout', 'Data', 'Showcase'];
