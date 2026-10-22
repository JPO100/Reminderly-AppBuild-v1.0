import { defineConfig } from 'vite'
import path from 'path'

// Siri core: Reminderly's Siri parsing as one plain script (global ReminderlySiri), with no DOM, for JavaScriptCore
// in the Siri intent (docs/plans/siri-locked-device.md). Built with `npm run build:siri-core` into the iOS app
// (ios/App/App/siri-core.js, a bundle resource, committed like public/); a test fails if it is out of date.
export default defineConfig({
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'ios/App/App',
    emptyOutDir: false,
    copyPublicDir: false,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/app/siri-core.ts'),
      name: 'ReminderlySiri',
      formats: ['iife'],
      fileName: () => 'siri-core.js',
    },
  },
})
