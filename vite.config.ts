import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@examples': path.resolve(__dirname, 'examples'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'InfinityFlow',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      insertTypesEntry: true,
      rollupTypes: false, // Avoid aggressive type rollup that can widen generics
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.d.ts', 'examples/**'],
    }),
  ],
});
