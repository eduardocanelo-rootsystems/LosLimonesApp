import { useEffect, useState } from 'react'

// Carga /logo-cliente.png como base64 para usarlo en @react-pdf/renderer.
// Devuelve null mientras carga o si el archivo no existe todavía.
export function useLogoCliente(): string | null {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/logo-cliente.png')
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.blob()
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          }),
      )
      .then(setLogoUrl)
      .catch(() => setLogoUrl(null))
  }, [])

  return logoUrl
}
