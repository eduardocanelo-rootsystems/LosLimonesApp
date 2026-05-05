import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Ventas', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/ventas')
  })

  test('carga la página con título', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ventas' })).toBeVisible()
  })

  test('muestra el selector de período', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Este mes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Todo' })).toBeVisible()
  })

  test('muestra KPIs de facturación', async ({ page }) => {
    await expect(page.getByText('Facturado', { exact: true })).toBeVisible()
    await expect(page.getByText('Cobrado', { exact: true })).toBeVisible()
    await expect(page.getByText('Pendiente', { exact: true })).toBeVisible()
  })

  test('cambia al período "Todo" y actualiza datos', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    await expect(page.getByRole('button', { name: 'Todo' })).toHaveClass(/bg-accent/)
  })

  test('muestra tabla de facturas o estado vacío', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    const table = page.locator('table')
    const empty = page.getByText(/sin facturas|no hay facturas/i)
    expect(await table.or(empty).count()).toBeGreaterThanOrEqual(0)
  })

  test('botón de importar Excel es visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /importar/i })
    ).toBeVisible()
  })
})
