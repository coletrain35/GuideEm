import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AnnotatedImageView } from '../components/AnnotatedImageView';

export interface AnnotatedImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotatedImage: {
      setAnnotatedImage: (options: { src: string; alt?: string }) => ReturnType;
      setAnnotatedImageAlign: (align: 'left' | 'center' | 'right') => ReturnType;
    };
  }
}

const alignToMargin = (align: string, width: number): string => {
  if (align === 'left') return 'margin-left: 0; margin-right: auto;';
  if (align === 'right') return 'margin-left: auto; margin-right: 0;';
  // center
  if (width >= 100) return ''; // full-width blocks are already centered
  return 'margin-left: auto; margin-right: auto;';
};

export const AnnotatedImage = Node.create<AnnotatedImageOptions>({
  name: 'annotatedImage',
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
      src: { default: null },
      alt: { default: null },
      width: { default: 100 },
      effect: { default: 'none' },
      align: { default: 'center' },
      caption: { default: '' },
      annotations: {
        default: [],
        parseHTML: element => {
          const parsed = element.getAttribute('data-annotations');
          return parsed ? JSON.parse(parsed) : [];
        },
        renderHTML: attributes => {
          // In Tiptap v3, `attributes` is the attribute value itself (the array), not the full node attrs
          const annotations = Array.isArray(attributes) ? attributes : (attributes.annotations ?? []);
          if (!annotations || annotations.length === 0) return {};
          return { 'data-annotations': JSON.stringify(annotations) };
        }
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="annotated-image"]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }: any) {
    // node.attrs.annotations is the most direct source; HTMLAttributes['data-annotations']
    // is a fallback for Tiptap versions where node may not be passed.
    const fromNode: any[] = node?.attrs?.annotations ?? [];
    const fromAttrs: any[] = HTMLAttributes['data-annotations']
      ? JSON.parse(HTMLAttributes['data-annotations'] as string)
      : [];
    const annotations: any[] = fromNode.length > 0 ? fromNode : fromAttrs;

    const effect: string = node?.attrs?.effect || 'none';
    const effectClass = effect !== 'none' ? ` image-effect-${effect}` : '';
    const align: string = node?.attrs?.align || 'center';
    const width: number = node?.attrs?.width ?? 100;
    const alignStyle = alignToMargin(align, width);
    const alignDataAttr = align !== 'center' ? ` data-align="${align}"` : '';

    const markers = annotations.map((ann: any, index: number) => {
      const safeX = Math.min(100, Math.max(0, parseFloat(ann.x) || 0));
      const safeY = Math.min(100, Math.max(0, parseFloat(ann.y) || 0));
      return ['div', {
        class: 'annotation-marker',
        style: `position: absolute; left: ${safeX}%; top: ${safeY}%; transform: translate(-50%, -50%); width: 28px; height: 28px; border-radius: 50%; background-color: var(--brand-primary, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: help; z-index: 20; flex-shrink: 0;`,
        'data-text': ann.text
      }, (index + 1).toString()];
    });

    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        {
          'data-type': 'annotated-image',
          class: `annotated-image-container${effectClass}`,
          'data-effect': effect,
          style: `width: ${width}%; ${alignStyle}${alignDataAttr}`,
        },
        annotations.length > 0 ? { 'data-annotations': JSON.stringify(annotations) } : {}
      ),
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt }],
      ...markers
    ];
  },

  addCommands() {
    return {
      setAnnotatedImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
      setAnnotatedImageAlign: (align) => ({ commands, chain, state, tr }) => {
        // Set on all selected annotated images; fall back to cursor position.
        const { from, to } = state.selection;
        let updated = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === 'annotatedImage') {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, align });
            updated = true;
            return false;
          }
          return true;
        });
        return updated;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnnotatedImageView);
  },
});
