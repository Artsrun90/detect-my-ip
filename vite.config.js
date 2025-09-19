import { defineConfig } from 'vite'
import { glob } from 'glob'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: glob.sync('**/*.html', { ignore: ['node_modules/**'] })
    },
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: 'public'
})
