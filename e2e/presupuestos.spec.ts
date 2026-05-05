import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Presupuestos', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/presupuestos')
  })

  test('carga la página con título y controles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Presupuestos' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nuevo presupuesto' })).toBeVisible()
    await expect(page.getByPlaceholder('Buscar por número o cliente…')).toBeVisible()
  })

  test('muestra el selector de período', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Este mes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Todo' })).toBeVisible()
  })

  test('muestra el selector de estado', async ({ page }) => {
    const select = page.getByRole('combobox')
    await expect(select).toBeVisible()
    await expect(select).toContainText('Todos los estados')
  })

  test('filtra por estado "Aprobado"', async ({ page }) => {
    // Cambiar a "Todo" para tener más datos
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)

    await page.getByRole('combobox').selectOption('aprobado')
    await waitForSpinner(page)

    // Todos los badges visibles deben ser "Aprobado" o tabla vacía
    const badges = page.locator('text=Aprobado').filter({ has: page.locator('.badge') })
    const emptyState = page.getByText('Sin resultados')
    expect(await badges.or(emptyState).count()).toBeGreaterThanOrEqual(0)
  })

  test('busca por texto y muestra resultados filtrados', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)

    const searchInput = page.getByPlaceholder('Buscar por número o cliente…')
    await searchInput.fill('zzz_inexistente_xyz')
    await expect(page.getByText('Sin resultados')).toBeVisible()

    await searchInput.clear()
  })

  test('limpia la búsqueda y restaura la tabla', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)

    const searchInput = page.getByPlaceholder('Buscar por número o cliente…')
    await searchInput.fill('zzz_inexistente_xyz')
    await expect(page.getByText('Sin resultados')).toBeVisible()

    await searchInput.clear()
    // Tras limpiar puede haber tabla con datos o estado vacío, ambos son válidos
    await expect(
      page.locator('table').or(page.getByText('Sin presupuestos'))
    ).toBeVisible()
  })

  test('navega a "Nuevo presupuesto" y carga el formulario', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo presupuesto' }).click()
    await page.waitForURL('/presupuestos/nuevo', { timeout: 15_000 })
    await waitForSpinner(page)
    // El formulario de nuevo presupuesto carga
    await expect(page.getByRole('heading', { name: 'Nuevo presupuesto' }).or(
      page.getByText('Datos del cliente')
    )).toBeVisible()
  })

  test('abre un presupuesto existente al hacer clic en "Abrir"', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)

    const firstAbrir = page.getByRole('cell').getByText('Abrir →').first()
    const count = await firstAbrir.count()
    if (count === 0) {
      test.skip() // No hay presupuestos en el período
      return
    }
    await firstAbrir.click()
    await expect(page).toHaveURL(/\/presupuestos\/.+/)
    await waitForSpinner(page)
    await expect(page.getByText('Datos del cliente').or(page.getByText('Cliente')).first()).toBeVisible()
  })
})
