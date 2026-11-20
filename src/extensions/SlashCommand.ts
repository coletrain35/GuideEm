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
        allowSpaces: true,
        pluginKey: SlashCommandPluginKey,
        allow({ state, range }: { state: any; range: any }) {
          const $from = state.doc.resolve(range.from);
          if ($from.parent.type.name !== 'paragraph' || $from.parentOffset !== 0) {
            return false;
          }
          const text = state.doc.textBetween(range.from, range.to, '\n', '\0');
          if (/^\/\s/.test(text)) return false;
          return true;
        },
        items({ query }: { query: string }): BlockItem[] {
          const q = query.trim().toLowerCase();
          if (!q) return BLOCK_ITEMS;
          const qCompact = q.replace(/\s+/g, '');
          return BLOCK_ITEMS.filter((item) => {
            const label = item.label.toLowerCase();
            const desc = item.description.toLowerCase();
            return (
              label.includes(q) ||
              label.replace(/\s+/g, '').includes(qCompact) ||
              desc.includes(q) ||
              item.keywords.some((kw) => kw.toLowerCase().includes(q) || kw.toLowerCase().replace(/\s+/g, '').includes(qCompact))
            );
          });
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
