import { Mark, mergeAttributes } from '@tiptap/core'

export interface TextBadgeOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textBadge: {
      setTextBadge: (attrs?: { color?: string }) => ReturnType
      unsetTextBadge: () => ReturnType
    }
  }
}

export const TextBadge = Mark.create<TextBadgeOptions>({
  name: 'textBadge',

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      color: {
        default: '#6366f1',
        parseHTML: element => element.getAttribute('data-badge-color') || '#6366f1',
        renderHTML: attributes => ({
          'data-badge-color': attributes.color,
          style: `background-color: ${attributes.color}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; display: inline;`,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-badge-color]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'text-badge' }), 0]
  },

  addCommands() {
    return {
      setTextBadge: (attrs = {}) => ({ commands }) => {
        return commands.setMark(this.name, attrs)
      },
      unsetTextBadge: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})
