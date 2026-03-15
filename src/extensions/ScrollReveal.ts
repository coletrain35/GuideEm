import { Extension } from '@tiptap/core';

export const REVEAL_TYPES = ['none', 'fade-up', 'slide-left', 'slide-right', 'zoom-in'] as const;
export type RevealType = typeof REVEAL_TYPES[number];

// Block-level node types that support per-element scroll reveal
const BLOCK_TYPES = [
  'heading', 'paragraph', 'bulletList', 'orderedList', 'taskList',
  'blockquote', 'codeBlock', 'callout', 'grid', 'accordion', 'tabGroup',
  'sectionDivider', 'videoEmbed', 'timeline', 'cardGrid', 'counter',
  'testimonial', 'heroBanner', 'statRow', 'codeDiff', 'beforeAfter',
  'annotatedImage', 'confetti',
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
        ({ editor, commands }) => {
          for (const type of BLOCK_TYPES) {
            if (editor.isActive(type)) {
              return commands.updateAttributes(type, { scrollReveal: reveal });
            }
          }
          return false;
        },
    };
  },
});
