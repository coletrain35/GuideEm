import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {guideEmAgentPlugin} from './src/server/agentBridgePlugin';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), guideEmAgentPlugin()],
    publicDir: 'Public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            tiptap: [
              '@tiptap/core',
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/suggestion',
              '@tiptap/extension-code-block-lowlight',
              '@tiptap/extension-highlight',
              '@tiptap/extension-link',
              '@tiptap/extension-placeholder',
              '@tiptap/extension-table',
              '@tiptap/extension-table-cell',
              '@tiptap/extension-table-header',
              '@tiptap/extension-table-row',
              '@tiptap/extension-task-item',
              '@tiptap/extension-task-list',
              '@tiptap/extension-text-align',
            ],
            syntax: ['highlight.js', 'lowlight', 'marked'],
            vendor: ['react', 'react-dom', 'lucide-react', 'localforage', 'dompurify', 'tippy.js'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
