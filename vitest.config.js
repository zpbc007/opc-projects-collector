import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'text'],
      include: ['src/lib/*.js'],
      exclude: ['**/*.test.js', '**/test/**', 'cli/**'],
      thresholds: {
        global: { lines: 70 }
      }
    },
    include: ['test/**/*.test.js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@config': path.resolve(__dirname, 'src/config')
    }
  }
});