import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'public',
  server: {
    port: 5173,
    open: '/login.html'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        login: resolve(__dirname, 'public/login.html'),
        team: resolve(__dirname, 'public/team.html'),
        players: resolve(__dirname, 'public/players.html'),
        matchHistory: resolve(__dirname, 'public/match-history.html'),
        draftSimulator: resolve(__dirname, 'public/draft-simulator.html')
      }
    }
  }
})
