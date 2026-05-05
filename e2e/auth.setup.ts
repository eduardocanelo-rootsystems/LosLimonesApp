import * as fs   from 'fs'
import * as path from 'path'
import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('autenticar usuario de prueba', async ({ page }) => {
  await page.goto('/login')

  await page.locator('#email').fill(process.env.TEST_EMAIL!)
  await page.locator('#password').fill(process.env.TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  // Esperar redirección al dashboard
  await page.waitForURL('/', { timeout: 20_000 })

  // Confirmar que el dashboard cargó
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })

  // Guardar sesión
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  await page.context().storageState({ path: AUTH_FILE })
})
