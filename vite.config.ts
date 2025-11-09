import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Expose process.env.API_KEY to the client-side bundle.
    // Vercel injects API_KEY during the build. We ensure it's
    // stringified for JavaScript, and defaults to an empty string
    // if not set, so the client-side validation correctly identifies it as missing.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
});
