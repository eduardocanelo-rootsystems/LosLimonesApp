import { useMemo, useState } from 'react'

type Dir = 'asc' | 'desc'

export function useSort<T extends Record<string, unknown>>(data: T[]) {
  const [col, setCol] = useState<keyof T | null>(null)
  const [dir, setDir] = useState<Dir>('asc')

  function toggle(newCol: keyof T) {
    if (col === newCol) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setCol(newCol)
      setDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!col) return data
    return [...data].sort((a, b) => {
      const av = a[col] ?? ''
      const bv = b[col] ?? ''
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true })
      return dir === 'asc' ? cmp : -cmp
    })
  }, [data, col, dir])

  return { sorted, col, dir, toggle }
}
