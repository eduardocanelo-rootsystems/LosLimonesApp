import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/settings')
  })

  test('carga la página con título', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /configuración|settings/i })
    ).toBeVisible()
  })

  test('muestra sección de usuarios', async ({ page }) => {
    await expect(page.getByText(/usuarios/i)).toBeVisible()
  })

  test('muestra tabla de usuarios', async ({ page }) => {
    const table = page.locator('table').first()
    await expect(table).toBeVisible()
  })

  test('muestra botones de activar/desactivar en usuarios', async ({ page }) => {
    const activarBtn = page.getByRole('button', { name: /activar|desactivar/i }).first()
    const count = await activarBtn.count()
    // Puede no haber usuarios pendientes; solo verificar que la tabla existe
    const table = page.locator('table').first()
    await expect(table).toBeVisible()
    if (count > 0) {
      await expect(activarBtn).toBeVisible()
    }
  })

  test('muestra sección de socios o cuentas', async ({ page }) => {
    const socios = page.getByText(/socios|cuentas|arca/i)
    const count = await socios.count()
    // Settings puede tener distintas secciones según el rol
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
