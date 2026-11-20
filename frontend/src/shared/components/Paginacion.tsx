import { Button } from '../ui/Button'

interface PaginacionProps {
  pagina: number // base 0
  totalPaginas: number
  onCambiar: (pagina: number) => void
  total?: number
}

export function Paginacion({ pagina, totalPaginas, onCambiar, total }: PaginacionProps) {
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4 pt-4 text-sm text-stone-600">
      <span>
        Página {pagina + 1} de {totalPaginas}
        {total !== undefined && ` · ${total} resultados`}
      </span>
      <div className="flex gap-2">
        <Button variante="secundario" tamano="sm" disabled={pagina === 0} onClick={() => onCambiar(pagina - 1)}>
          ← Anterior
        </Button>
        <Button
          variante="secundario"
          tamano="sm"
          disabled={pagina + 1 >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
