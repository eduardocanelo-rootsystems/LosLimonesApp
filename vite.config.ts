import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { execSync } from 'node:child_process'

function gitValue(cmd: string, fallback: string) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim() } catch { return fallback }
}
const GIT_HASH  = gitValue('git rev-parse --short HEAD', 'dev')
const GIT_COUNT = gitValue('git rev-list --count HEAD', '0')

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __GIT_HASH__:  JSON.stringify(GIT_HASH),
    __GIT_COUNT__: JSON.stringify(GIT_COUNT),
  },
  plugins: [react()],
  esbuild: {
    legalComments: 'none',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('@tanstack/react-query')) return 'vendor-query'
          if (id.includes('@react-pdf')) return 'vendor-pdf'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('/xlsx/')) return 'vendor-xlsx'
          if (id.includes('lucide-react') || id.includes('/sonner/') || id.includes('/clsx/') || id.includes('tailwind-merge')) return 'vendor-ui'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
