import { type Page, expect } from '@playwright/test'

/** Espera a que el spinner de carga desaparezca */
export async function waitForSpinner(page: Page) {
  const spinner = page.locator('.animate-spin').first()
  try {
    await spinner.waitFor({ state: 'visible', timeout: 3_000 })
    await spinner.waitFor({ state: 'hidden',  timeout: 20_000 })
  } catch {
    // El spinner puede no aparecer si la data carga muy rápido
  }
}

/** Navega y espera que la página principal cargue sin spinner */
export async function gotoAndWait(page: Page, url: string) {
  await page.goto(url)
  await waitForSpinner(page)
}

/** Cierra un modal buscando el botón aria-label="Cerrar" */
export async function closeModal(page: Page) {
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

/** Hoy en formato YYYY-MM-DD para inputs type="date" */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
