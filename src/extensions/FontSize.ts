import { Mark, mergeAttributes } from '@tiptap/core'

export type FontSizeValue = 'small' | 'large'

const SIZE_MAP: Record<FontSizeValue, string> = {
  small: '0.8em',
  large: '1.3em',
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: FontSizeValue) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: element => element.getAttribute('data-font-size'),
        renderHTML: attributes => ({ 'data-font-size': attributes.size }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-font-size]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const size = HTMLAttributes['data-font-size'] as FontSizeValue | null
    const fontSize = size ? SIZE_MAP[size] : undefined
    return [
      'span',
      mergeAttributes(HTMLAttributes, fontSize ? { style: `font-size: ${fontSize}` } : {}),
      0,
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ commands }) =>
          commands.setMark(this.name, { size }),
      unsetFontSize:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
