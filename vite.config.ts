/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://node.gitlawb.com',
        changeOrigin: true,
        secure: true,
      },
      // Node identity lives at the node's root path, which the SPA occupies locally.
      '/node-info': {
        target: 'https://node.gitlawb.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/',
      },
    },
  },
})
