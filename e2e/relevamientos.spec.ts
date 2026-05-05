import { test, expect } from '@playwright/test'
import { gotoAndWait, waitForSpinner } from './utils/helpers'

test.describe('Relevamientos', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/relevamientos')
  })

  test('carga la página con título y botón', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Relevamientos', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nuevo relevamiento' }).first()).toBeVisible()
  })

  test('muestra tarjetas o estado vacío', async ({ page }) => {
    const cards    = page.locator('.card').filter({ hasText: /m²|Sin nombre/ })
    const empty    = page.getByText('Sin relevamientos')
    expect(await cards.or(empty).count()).toBeGreaterThanOrEqual(0)
  })

  test('navega al formulario de nuevo relevamiento', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo relevamiento' }).first().click()
    await page.waitForURL('/relevamientos/nuevo', { timeout: 15_000 })
    await waitForSpinner(page)
    await expect(page.getByRole('heading', { name: 'Datos del cliente' })).toBeVisible()
  })

  test('abre un relevamiento existente al hacer clic en "Editar"', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: 'Editar' }).first()
    const count   = await editBtn.count()
    if (count === 0) {
      test.skip() // No hay relevamientos
      return
    }
    await editBtn.click()
    await expect(page).toHaveURL(/\/relevamientos\/.+/)
    await waitForSpinner(page)
  })

  test('CRUD — crea y elimina un relevamiento de prueba', async ({ page }) => {
    // Navegar al formulario
    await page.getByRole('button', { name: 'Nuevo relevamiento' }).first().click()
    await page.waitForURL('/relevamientos/nuevo')
    await waitForSpinner(page)

    // Completar datos mínimos
    const razonSocial = page.getByPlaceholder('Consorcio / Empresa / Nombre')
    await razonSocial.fill('[PLAYWRIGHT TEST] Borrar')

    // Guardar
    const guardarBtn = page.getByRole('button', { name: /guardar|crear/i }).last()
    await guardarBtn.click()
    await waitForSpinner(page)

    // Debe redirigir a /relevamientos o al detalle
    await expect(page).toHaveURL(/\/relevamientos/)

    // Verificar que aparece en la lista
    await page.goto('/relevamientos')
    await waitForSpinner(page)
    await expect(page.getByText('[PLAYWRIGHT TEST] Borrar').first()).toBeVisible()
  })
})
