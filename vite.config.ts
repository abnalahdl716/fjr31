import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      {
        name: 'copy-standalone-html',
        closeBundle() {
          try {
            if (fs.existsSync('dist/index.html')) {
              fs.copyFileSync('dist/index.html', 'الموقع_بدون_انترنت.html');
              fs.copyFileSync('dist/index.html', 'تشغيل_الموقع_مباشرة.html');
            }
          } catch (e) {
            console.error('Failed to copy standalone html:', e);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
