import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';
import sentry from '@sentry/astro';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      sizes: [640, 828, 1200],
      formats: ['image/avif', 'image/webp'],
    },
  }),
  integrations: [
    react(),
    auth(),
    sentry({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV || 'development',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  },
});
