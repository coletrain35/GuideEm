import { Mark, mergeAttributes } from '@tiptap/core'

export type AnimationType = 'shimmer' | 'typewriter' | 'fade-in-word'

export interface AnimatedTextOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    animatedText: {
      setAnimatedText: (attrs?: { animation?: AnimationType }) => ReturnType
      unsetAnimatedText: () => ReturnType
    }
  }
}

export const AnimatedText = Mark.create<AnimatedTextOptions>({
  name: 'animatedText',

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      animation: {
        default: 'shimmer',
        parseHTML: element => element.getAttribute('data-animation') || 'shimmer',
        renderHTML: attributes => ({
          'data-animation': attributes.animation,
          class: `animated-text animated-text-${attributes.animation}`,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-animation]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setAnimatedText: (attrs = {}) => ({ commands }) => {
        return commands.setMark(this.name, attrs)
      },
      unsetAnimatedText: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})
