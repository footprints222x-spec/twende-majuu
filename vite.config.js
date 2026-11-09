import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks only to Vite; Vite forwards /api to Flask.
// That means no CORS setup is needed locally, and the site also works when you
// open it from a phone on the same Wi-Fi (http://<your-computer-ip>:5173).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.DEV_API_TARGET || 'http://127.0.0.1:5000';
  const proxy = { '/api': { target, changeOrigin: true } };

  return {
    plugins: [react()],
    server: { host: true, port: 5173, proxy },
    preview: { host: true, port: 4173, proxy },
    build: { sourcemap: false, chunkSizeWarningLimit: 700 },
  };
});
