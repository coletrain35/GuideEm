import { Mark, mergeAttributes } from '@tiptap/core';

export const Kbd = Mark.create({
  name: 'kbd',

  parseHTML() {
    return [{ tag: 'kbd' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['kbd', mergeAttributes({ class: 'guide-kbd' }, HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-k': () => this.editor.chain().focus().toggleMark(this.name).run(),
    };
  },
});
