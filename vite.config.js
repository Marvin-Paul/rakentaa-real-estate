import { defineConfig, normalizePath } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cmsPlugin } from './server/cms.mjs';
export default defineConfig({
  plugins: [cmsPlugin(), react(), tailwindcss()],
  server: {
    fs: {
      // Vite serves source files in development; keep CMS records private there too.
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**', '**/admin.json', '**/content.json', `${normalizePath(path.resolve(process.env.CMS_DATA_DIR || 'data'))}/**`],
    },
  },
});
