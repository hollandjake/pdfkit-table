import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
    },
  },
  build: {
    target: ['node18', 'firefox102', 'safari14'],
    minify: false,
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, './src/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    ssr: true,
  },
  plugins: [dts({ exclude: ['**/*.test.ts'], rollupTypes: true })],
});
