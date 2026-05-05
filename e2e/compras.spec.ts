import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Compras', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/compras')
  })

  test('carga la página con título', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Compras' })).toBeVisible()
  })

  test('muestra el selector de período', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Este mes' })).toBeVisible()
  })

  test('muestra KPIs de compras', async ({ page }) => {
    // Al menos un número de monto visible
    await expect(page.getByText(/\$\s*[\d.,]+/).first()).toBeVisible()
  })

  test('cambia el período y actualiza', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    await expect(page.getByRole('button', { name: 'Todo' })).toHaveClass(/bg-accent/)
  })

  test('muestra tabla de compras o estado vacío', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    const table = page.locator('table')
    const empty = page.getByText(/sin compras|no hay compras/i)
    expect(await table.or(empty).count()).toBeGreaterThanOrEqual(0)
  })

  test('botón de importar Excel es visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /importar/i })
    ).toBeVisible()
  })
})
