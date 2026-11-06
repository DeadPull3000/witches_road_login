import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const roadArt = 'virtual:road-art';
const resolvedRoadArt = '\0' + roadArt;

export default defineConfig(({ command }) => ({
  base: './',
  // The checkout keeps original paintings beside the runtime exports. Vite emits only WebPs on build.
  publicDir: command === 'build' ? false : 'public',
  plugins: [react(), {
    name: 'road-art',
    resolveId(id) { if (id === roadArt) return resolvedRoadArt; },
    load(id) {
      if (id !== resolvedRoadArt) return;
      if (command !== 'build') return 'export const artUrl = path => path;';
      return `
        const urls = import.meta.glob('/public/assets/**/*.webp', { eager: true, import: 'default', query: '?url' });
        export const artUrl = path => urls['/public' + path] ?? path;
      `;
    },
  }],
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
  server: { port: 5187, strictPort: true, watch: { ignored: ['**/playwright-report/**', '**/test-results/**', '**/dist/**'] } },
}));
