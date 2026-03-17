import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // .js import ni .ts ga yo'naltirish (ESM + TypeScript loyihalari uchun)
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    isolate: true,
  },
});
