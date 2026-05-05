import { test, expect } from '@playwright/test'
import { gotoAndWait } from './utils/helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/')
  })

  test('muestra el título y el selector de período', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Este mes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Todo' })).toBeVisible()
  })

  test('muestra las secciones de KPIs', async ({ page }) => {
    await expect(page.getByRole('main').getByText('Ventas', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Compras y resultado')).toBeVisible()
    await expect(page.getByRole('main').getByText('Presupuestos', { exact: true })).toBeVisible()
    await expect(page.getByText('Rentabilidad (presupuestos cobrados)')).toBeVisible()
  })

  test('muestra el botón de exportar PDF', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Exportar PDF/i })).toBeVisible()
  })

  test('cambia el período al hacer clic en "Todo"', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    // El botón queda activo (distinto estilo) y los KPIs se actualizan
    const btnTodo = page.getByRole('button', { name: 'Todo' })
    await expect(btnTodo).toHaveClass(/bg-accent/)
  })

  test('cambia el período al hacer clic en "Últ. 6 meses"', async ({ page }) => {
    await page.getByRole('button', { name: 'Últ. 6 meses' }).click()
    await expect(page.getByRole('button', { name: 'Últ. 6 meses' })).toHaveClass(/bg-accent/)
  })
})
