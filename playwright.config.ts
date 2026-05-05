import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'fs'

// Load .env.test manually (avoids dotenv dependency)
try {
  const raw = readFileSync('.env.test', 'utf-8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] ??= m[2].trim()
  }
} catch { /* file not present in CI, use defaults */ }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:           process.env.BASE_URL ?? 'https://www.limonescreativos.com',
    trace:             'on-first-retry',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // 1. Login una vez — guarda sesión
    {
      name:      'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 2. Todos los tests reutilizan esa sesión
    {
      name: 'chromium',
      use:  {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
})
