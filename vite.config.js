// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_', 
  define: {
    // Development ortamı için fallback değer
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5000'),
  }
});