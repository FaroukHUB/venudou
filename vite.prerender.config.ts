import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Build SSR dédié au pré-rendu statique des pages publiques.
// Volontairement sans le plugin Cloudflare ni Tailwind (le CSS est produit
// par le build client ; scripts/prerender.mjs le référence via le manifest).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    ssr: 'src/marketing/prerender-entry.tsx',
    outDir: 'dist/prerender',
    emptyOutDir: true,
    sourcemap: false,
  },
});
