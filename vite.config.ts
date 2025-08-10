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
      formats: ['es', "cjs"], // Bundle as ESM and UMD
    },
    rollupOptions: {
      external: [
        // List external dependencies here, e.g. 'react', 'vue', etc.
      ],
      output: {
        globals: {

        },
      },
    },
  },
  plugins: [dts({
    entryRoot: 'src',
    outDir: 'dist',
    tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
    insertTypesEntry: true, // Only generate a single index.d.ts
    rollupTypes: true, // Bundle types into one file
  })],
});
