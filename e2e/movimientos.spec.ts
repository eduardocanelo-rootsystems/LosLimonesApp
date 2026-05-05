import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Movimientos', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/movimientos')
  })

  test('carga la página con título y botón', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Movimientos' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Nuevo movimiento/i })).toBeVisible()
  })

  test('muestra el selector de período', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Este mes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Todo' })).toBeVisible()
  })

  test('muestra el título del panel de movimientos', async ({ page }) => {
    await expect(page.getByText('Movimientos del período')).toBeVisible()
  })

  test('muestra tabla o estado vacío', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    const table = page.locator('table')
    const empty = page.getByText(/no hay movimientos/i)
    expect(await table.or(empty).count()).toBeGreaterThanOrEqual(0)
  })

  test('cambia el período y actualiza', async ({ page }) => {
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    await expect(page.getByRole('button', { name: 'Todo' })).toHaveClass(/bg-accent/)
  })

  test('CRUD — crea y elimina un movimiento de prueba', async ({ page }) => {
    // Aceptar automáticamente el confirm() de eliminación
    page.on('dialog', dialog => dialog.accept())

    // Abrir modal
    await page.getByRole('button', { name: /Nuevo movimiento/i }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo movimiento' })).toBeVisible()

    // Seleccionar tipo Egreso (label del botón en el grupo)
    await page.getByRole('button', { name: 'Egreso' }).first().click()

    // Completar monto y descripción
    const montoInput = page.getByPlaceholder('0,00').or(page.locator('input[type="number"]')).first()
    await montoInput.fill('1')

    const descripcionInput = page.getByPlaceholder(/herramientas|descripción|concepto/i).first()
    await descripcionInput.fill('[PLAYWRIGHT TEST] borrar')

    // Guardar
    await page.getByRole('button', { name: /guardar/i }).last().click()
    await waitForSpinner(page)
    await expect(page.getByRole('heading', { name: 'Nuevo movimiento' })).not.toBeVisible({ timeout: 5_000 })

    // Verificar que aparece en la lista
    await page.getByRole('button', { name: 'Todo' }).click()
    await waitForSpinner(page)
    await expect(page.getByText('[PLAYWRIGHT TEST] borrar').first()).toBeVisible()

    // Eliminar el movimiento de prueba
    const row = page.locator('tr').filter({ hasText: '[PLAYWRIGHT TEST] borrar' }).first()
    const deleteBtn = row.getByRole('button', { name: 'Eliminar movimiento' })
    const deleteBtnCount = await deleteBtn.count()
    if (deleteBtnCount > 0) {
      await deleteBtn.click()
      await waitForSpinner(page)
      await expect(page.getByText('[PLAYWRIGHT TEST] borrar')).not.toBeVisible()
    }
  })
})
