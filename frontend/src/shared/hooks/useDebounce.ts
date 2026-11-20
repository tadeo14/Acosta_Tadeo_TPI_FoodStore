import { useEffect, useState } from 'react'

/** Devuelve el valor recién cuando dejó de cambiar durante `ms` (no hace fetch). */
export function useDebounce<T>(valor: T, ms = 350): T {
  const [debounced, setDebounced] = useState(valor)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(valor), ms)
    return () => window.clearTimeout(id)
  }, [valor, ms])
  return debounced
}
