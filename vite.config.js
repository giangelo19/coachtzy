import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

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
  },
  plugins: [
    {
      name: 'copy-assets',
      closeBundle() {
        // Ensure assets directory exists
        try {
          mkdirSync(resolve(__dirname, 'dist/assets'), { recursive: true });
          // Copy default_pfp.png without hash
          copyFileSync(
            resolve(__dirname, 'public/assets/default_pfp.png'),
            resolve(__dirname, 'dist/assets/default_pfp.png')
          );
          console.log('✓ Copied default_pfp.png to dist/assets');
        } catch (err) {
          console.error('Error copying assets:', err);
        }
      }
    }
  ]
})
