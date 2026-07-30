import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // @helpdesk/core is a linked (file:../core) CommonJS package, and Vite skips
  // pre-bundling for linked deps by default — without this the browser gets raw
  // `exports`/`require` and blows up.
  optimizeDeps: {
    include: ['@helpdesk/core'],
  },
})
