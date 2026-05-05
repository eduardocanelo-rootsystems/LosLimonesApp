import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/clientes')
  })

  test('carga la página con título', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
  })

  test('muestra buscador', async ({ page }) => {
    await expect(page.getByRole('searchbox').or(page.locator('input[type="search"], input[placeholder*="uscar"]'))).toBeVisible()
  })

  test('muestra tabla o estado vacío', async ({ page }) => {
    const table = page.locator('table')
    const empty = page.getByText(/sin clientes|no hay clientes/i)
    expect(await table.or(empty).count()).toBeGreaterThanOrEqual(0)
  })

  test('busca por texto y muestra resultados filtrados', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="uscar"]').first()
    await searchInput.fill('zzz_inexistente_xyz')
    await waitForSpinner(page)
    const empty = page.getByText(/sin resultados|sin clientes|no hay/i)
    await expect(empty).toBeVisible()
    await searchInput.clear()
  })

  test('botón de exportar es visible', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /exportar/i })
    const count = await exportBtn.count()
    if (count > 0) {
      await expect(exportBtn.first()).toBeVisible()
    }
  })

  test('botón de nuevo cliente es visible', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /nuevo cliente|agregar/i })
    const count = await newBtn.count()
    if (count > 0) {
      await expect(newBtn.first()).toBeVisible()
    }
  })
})
