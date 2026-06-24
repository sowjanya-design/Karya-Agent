import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React runtime — tiny, cached forever
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Animation library — large, rarely changes
            'vendor-motion': ['motion'],
            // Icon library
            'vendor-icons': ['lucide-react'],
            // UI utilities
            'vendor-ui': ['sonner', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3007',
          changeOrigin: true,
        }
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
