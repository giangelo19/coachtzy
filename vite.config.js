import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  server: {
    port: 5173,
    open: '/login.html'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
