import { Mark, mergeAttributes } from '@tiptap/core'

export interface GradientTextOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gradientText: {
      setGradientText: (attrs?: { colorFrom?: string; colorTo?: string; direction?: string }) => ReturnType
      unsetGradientText: () => ReturnType
    }
  }
}

export const GradientText = Mark.create<GradientTextOptions>({
  name: 'gradientText',

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      colorFrom: {
        default: '#6366f1',
        parseHTML: element => element.getAttribute('data-gradient-from') || '#6366f1',
        renderHTML: attributes => ({ 'data-gradient-from': attributes.colorFrom }),
      },
      colorTo: {
        default: '#ec4899',
        parseHTML: element => element.getAttribute('data-gradient-to') || '#ec4899',
        renderHTML: attributes => ({ 'data-gradient-to': attributes.colorTo }),
      },
      direction: {
        default: 'to right',
        parseHTML: element => element.getAttribute('data-gradient-dir') || 'to right',
        renderHTML: attributes => ({ 'data-gradient-dir': attributes.direction }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-gradient]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const from = HTMLAttributes['data-gradient-from'] || '#6366f1'
    const to = HTMLAttributes['data-gradient-to'] || '#ec4899'
    const dir = HTMLAttributes['data-gradient-dir'] || 'to right'
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-gradient': 'true',
        style: `background: linear-gradient(${dir}, ${from}, ${to}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setGradientText: (attrs = {}) => ({ commands }) => {
        return commands.setMark(this.name, attrs)
      },
      unsetGradientText: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})
