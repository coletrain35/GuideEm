import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InteractiveDemoView } from '../components/InteractiveDemoView';

export interface InteractiveDemoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    interactiveDemo: {
      setInteractiveDemo: () => ReturnType;
    };
  }
}

export const InteractiveDemo = Node.create<InteractiveDemoOptions>({
  name: 'interactiveDemo',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      frames: {
        default: [],
        parseHTML: element => {
          const raw = element.getAttribute('data-frames');
          return raw ? JSON.parse(raw) : [];
        },
        renderHTML: attributes => {
          const frames = Array.isArray(attributes) ? attributes : (attributes.frames ?? []);
          if (!frames || frames.length === 0) return {};
          return { 'data-frames': JSON.stringify(frames) };
        },
      },
      hotspots: {
        default: [],
        parseHTML: element => {
          const raw = element.getAttribute('data-hotspots');
          return raw ? JSON.parse(raw) : [];
        },
        renderHTML: attributes => {
          const hotspots = Array.isArray(attributes) ? attributes : (attributes.hotspots ?? []);
          if (!hotspots || hotspots.length === 0) return {};
          return { 'data-hotspots': JSON.stringify(hotspots) };
        },
      },
      transition: {
        default: 'fade',
        parseHTML: element => element.getAttribute('data-transition') || 'fade',
        renderHTML: attributes => {
          const val = typeof attributes === 'string' ? attributes : attributes.transition;
          return { 'data-transition': val || 'fade' };
        },
      },
      activeFrameId: {
        default: null,
        // Editor-only, not persisted to HTML
        renderHTML: () => ({}),
      },
      showNav: {
        default: true,
        parseHTML: element => element.getAttribute('data-show-nav') !== 'false',
        renderHTML: attributes => {
          const val = typeof attributes === 'boolean' ? attributes : attributes.showNav;
          return { 'data-show-nav': String(val ?? true) };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="interactive-demo"]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }: any) {
    const frames: any[] = node?.attrs?.frames ?? [];
    const firstFrame = frames[0];

    const children: any[] = [];
    if (firstFrame?.image) {
      children.push(['img', { src: firstFrame.image, alt: firstFrame.label || 'Demo frame' }]);
    }

    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-type': 'interactive-demo' },
      ),
      ...children,
    ];
  },

  addCommands() {
    return {
      setInteractiveDemo: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(InteractiveDemoView);
  },
});
