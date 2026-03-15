import { Mark, mergeAttributes } from '@tiptap/core'

export type InlineCodeLanguage = '' | 'js' | 'ts' | 'py' | 'html' | 'css' | 'bash'

export interface InlineCodeOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineCode: {
      setInlineCodeLanguage: (language: InlineCodeLanguage) => ReturnType
    }
  }
}

export const InlineCode = Mark.create<InlineCodeOptions>({
  name: 'code',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  excludes: '_',
  code: true,

  addAttributes() {
    return {
      language: {
        default: '',
        parseHTML: element => element.getAttribute('data-language') || '',
        renderHTML: attributes => {
          const lang = (attributes.language as string) || ''
          return {
            ...(lang ? { 'data-language': lang } : {}),
            class: `inline-code${lang ? ` lang-${lang}` : ''}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'code', preserveWhitespace: 'full' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['code', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleCode: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      setInlineCodeLanguage: (language: InlineCodeLanguage) => ({ commands }) => {
        return commands.updateAttributes(this.name, { language })
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-e': () => this.editor.commands.toggleCode(),
    }
  },
})
