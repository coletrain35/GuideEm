import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { BLOCK_ITEMS, type BlockItem } from '../utils/blockItems';
import { SlashCommandMenu, type SlashCommandMenuRef } from '../components/SlashCommandMenu';

const SlashCommandPluginKey = new PluginKey('slashCommand');

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: SlashCommandPluginKey,
        allow({ editor }: { editor: any }) {
          const { $from } = editor.state.selection;
          return editor.state.selection.empty && $from.parent.content.size === 0;
        },
        items({ query }: { query: string }): BlockItem[] {
          const q = query.toLowerCase();
          if (!q) return BLOCK_ITEMS;
          return BLOCK_ITEMS.filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.keywords.some((kw) => kw.includes(q))
          );
        },
        command({ editor, range, props }: { editor: any; range: any; props: BlockItem }) {
          editor.chain().focus().deleteRange(range).run();
          props.action(editor);
        },
        render: () => {
          let component: ReactRenderer<SlashCommandMenuRef> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart(props: any) {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                maxWidth: 'none',
              });
            },
            onUpdate(props: any) {
              component?.updateProps(props);
              if (popup?.[0] && props.clientRect) {
                popup[0].setProps({ getReferenceClientRect: props.clientRect });
              }
            },
            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      } as any,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
