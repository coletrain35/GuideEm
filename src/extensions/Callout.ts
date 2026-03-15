import { Node, mergeAttributes } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type?: 'info' | 'warning' | 'success') => ReturnType
      toggleCallout: (type?: 'info' | 'warning' | 'success') => ReturnType
    }
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return {
            'data-type': attributes.type,
            class: `callout callout-${attributes.type}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="info"]' },
      { tag: 'div[data-type="warning"]' },
      { tag: 'div[data-type="success"]' },
      { tag: 'div.callout' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setCallout: (type = 'info') => ({ commands }) => {
        return commands.setNode(this.name, { type })
      },
      toggleCallout: (type = 'info') => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph', { type })
      },
    }
  },
})
