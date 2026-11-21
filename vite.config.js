import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/quiz-bowl/ on GitHub Pages.
export default defineConfig({
  base: '/quiz-bowl/',
  plugins: [react()],
});
