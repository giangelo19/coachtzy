import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

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
        try {
          const distAssets = resolve(__dirname, 'dist/assets');
          mkdirSync(distAssets, { recursive: true });
          
          // Copy default_pfp.png
          copyFileSync(
            resolve(__dirname, 'public/assets/default_pfp.png'),
            join(distAssets, 'default_pfp.png')
          );
          console.log('✓ Copied default_pfp.png');
          
          // Copy lane/role icons
          const roleIcons = ['jungle.png', 'midLane.png', 'goldLane.png', 'expLane.png', 'roam.png'];
          roleIcons.forEach(icon => {
            const src = resolve(__dirname, 'public/assets', icon);
            const dest = join(distAssets, icon);
            try {
              copyFileSync(src, dest);
            } catch (e) {
              console.warn(`Could not copy ${icon}`);
            }
          });
          console.log('✓ Copied role icons');
          
          // Copy heroes folder
          const heroesDir = resolve(__dirname, 'public/assets/heroes');
          const distHeroesDir = join(distAssets, 'heroes');
          mkdirSync(distHeroesDir, { recursive: true });
          
          const heroFiles = readdirSync(heroesDir);
          heroFiles.forEach(file => {
            const src = join(heroesDir, file);
            const dest = join(distHeroesDir, file);
            if (statSync(src).isFile()) {
              copyFileSync(src, dest);
            }
          });
          console.log(`✓ Copied ${heroFiles.length} hero icons`);
          
        } catch (err) {
          console.error('Error copying assets:', err);
        }
      }
    }
  ]
})
