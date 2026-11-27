// The demo of this pack: Headless UI's React playground examples in a Vite app, styled with Tailwind CSS 4 (the
// playground's own styles.css). Two stand-ins (src/shims/): one example links to the playground's index with Next.js's
// Link, which is a plain link here; two take react-flatpickr's default import, which a CommonJS package hands over as its
// whole module in Vite's build.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: fileURLToPath(new URL('./src/shims/next-link.tsx', import.meta.url)) },
      { find: /^react-flatpickr$/, replacement: fileURLToPath(new URL('./src/shims/react-flatpickr.tsx', import.meta.url)) },
    ],
  },
});
