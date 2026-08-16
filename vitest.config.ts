import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Módulo virtual do Next.js — stub em ambiente de teste.
      'server-only': path.resolve(__dirname, './tests/shims/server-only.ts'),
    },
  },
});
