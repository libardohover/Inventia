import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            charts: ['recharts'],
            markdown: ['react-markdown', 'remark-gfm'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      // DISABLE_HMR=true desactiva la recarga en caliente (usado por AI Studio).
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
