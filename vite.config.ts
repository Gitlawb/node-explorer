/// <reference types="vitest/config" />
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.{ts,tsx}'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://node.gitlawb.com',
        changeOrigin: true,
        secure: true,
        bypass(req) {
          const url = req.url!
          const localPath = path.resolve(__dirname, url.slice(1))
          if (fs.existsSync(localPath)) {
            return url
          }
        },
      },
      // Node identity lives at the node's root path, which the SPA occupies locally.
      '/node-info': {
        target: 'https://node.gitlawb.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/',
      },
      // Peer nodes for the network page (no CORS on nodes — same list as
      // vercel.json and src/lib/nodes.ts). `/nodes/<id>/node-info` maps to the
      // peer's root; everything else keeps its path with the prefix stripped.
      ...Object.fromEntries(
        [
          ['node2', 'https://node2.gitlawb.com'],
          ['node3', 'https://node3.gitlawb.com'],
          ['manila', 'https://manila.gitlawb.com'],
        ].map(([id, target]) => [
          `/nodes/${id}`,
          {
            target,
            changeOrigin: true,
            secure: true,
            rewrite: (path: string) => {
              const rest = path.slice(`/nodes/${id}`.length)
              return rest === '/node-info' ? '/' : rest
            },
          },
        ]),
      ),
    },
  },
})
