import { isAxiosError } from 'axios'

interface ErrorValidacion {
  loc: (string | number)[]
  msg: string
}

function esErrorValidacion(valor: unknown): valor is ErrorValidacion {
  return typeof valor === 'object' && valor !== null && 'msg' in valor && 'loc' in valor
}

/** Convierte el `detail` de la API (string o lista de errores 422) en un mensaje para la pantalla. */
export function handleApiError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?'
    const detail: unknown = (error.response.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .filter(esErrorValidacion)
        .map((e) => `${String(e.loc[e.loc.length - 1])}: ${e.msg}`)
        .join(' · ')
    }
    return `Error ${error.response.status}`
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado'
}
