import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const searchReplaceKey = new PluginKey<DecorationSet>('searchReplace');

function findMatches(
  doc: any,
  term: string,
  caseSensitive: boolean
): { from: number; to: number }[] {
  const matches: { from: number; to: number }[] = [];
  if (!term) return matches;

  const needle = caseSensitive ? term : term.toLowerCase();

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return;
    const haystack = caseSensitive ? node.text : node.text.toLowerCase();
    let start = 0;
    while (start < haystack.length) {
      const idx = haystack.indexOf(needle, start);
      if (idx === -1) break;
      matches.push({ from: pos + idx, to: pos + idx + needle.length });
      start = idx + 1;
    }
  });

  return matches;
}

export const SearchReplace = Extension.create({
  name: 'searchReplace',

  addStorage() {
    return {
      searchTerm: '' as string,
      replaceTerm: '' as string,
      caseSensitive: false as boolean,
      currentMatchIndex: 0 as number,
      matches: [] as { from: number; to: number }[],
    };
  },

  addProseMirrorPlugins() {
    // Capture storage reference in closure so the plugin apply fn can read it
    const storage = this.storage as {
      searchTerm: string;
      caseSensitive: boolean;
      currentMatchIndex: number;
      matches: { from: number; to: number }[];
    };

    return [
      new Plugin({
        key: searchReplaceKey,

        state: {
          init(_config, _state) {
            return DecorationSet.empty;
          },
          apply(_tr, _old, _oldState, newState) {
            const { searchTerm, caseSensitive, currentMatchIndex } = storage;

            if (!searchTerm.trim()) {
              storage.matches = [];
              return DecorationSet.empty;
            }

            const matches = findMatches(newState.doc, searchTerm, caseSensitive);
            storage.matches = matches;

            if (!matches.length) return DecorationSet.empty;

            const decorations = matches.map((match, index) =>
              Decoration.inline(match.from, match.to, {
                class:
                  index === currentMatchIndex
                    ? 'search-match-current'
                    : 'search-match',
              })
            );

            return DecorationSet.create(newState.doc, decorations);
          },
        },

        props: {
          decorations(state) {
            return searchReplaceKey.getState(state) ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
