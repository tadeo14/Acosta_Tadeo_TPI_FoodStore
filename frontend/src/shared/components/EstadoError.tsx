import { handleApiError } from '../api/handleApiError'
import { Button } from '../ui/Button'

interface EstadoErrorProps {
  error: unknown
  onReintentar?: () => void
}

export function EstadoError({ error, onReintentar }: EstadoErrorProps) {
  return (
    <div className="rounded-xl bg-red-50 p-6 text-center ring-1 ring-red-200">
      <p className="text-sm font-medium text-red-800">No se pudieron cargar los datos</p>
      <p className="mt-1 text-sm text-red-600">{handleApiError(error)}</p>
      {onReintentar && (
        <Button variante="secundario" tamano="sm" className="mt-4" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function AlertaError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null
  return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{mensaje}</div>
}
