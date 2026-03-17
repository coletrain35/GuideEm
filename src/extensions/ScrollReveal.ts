import { Extension } from '@tiptap/core';

export const REVEAL_TYPES = ['none', 'fade-up', 'slide-left', 'slide-right', 'zoom-in'] as const;
export type RevealType = typeof REVEAL_TYPES[number];

// Block-level node types that support per-element scroll reveal
export const BLOCK_TYPES = [
  'heading', 'paragraph', 'bulletList', 'orderedList', 'taskList',
  'blockquote', 'codeBlock', 'callout', 'grid', 'accordion', 'tabGroup',
  'sectionDivider', 'videoEmbed', 'timeline', 'cardGrid', 'counter',
  'testimonial', 'heroBanner', 'statRow', 'codeDiff', 'beforeAfter',
  'annotatedImage', 'confetti', 'backgroundSection',
];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scrollReveal: {
      setScrollReveal: (reveal: RevealType) => ReturnType;
    };
  }
}

export const ScrollReveal = Extension.create({
  name: 'scrollReveal',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          scrollReveal: {
            default: null,
            parseHTML: (el) => el.getAttribute('data-scroll-reveal') || null,
            renderHTML: (attrs) => {
              if (!attrs.scrollReveal || attrs.scrollReveal === 'none') return {};
              return { 'data-scroll-reveal': attrs.scrollReveal };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setScrollReveal:
        (reveal: RevealType) =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if ((BLOCK_TYPES as readonly string[]).includes(node.type.name)) {
              return commands.updateAttributes(node.type.name, { scrollReveal: reveal === 'none' ? null : reveal });
            }
          }
          return false;
        },
    };
  },
});
