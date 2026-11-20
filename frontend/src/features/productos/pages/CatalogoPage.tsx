import { useState } from 'react'

import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonTarjetas } from '../../../shared/components/Skeleton'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Input, Select } from '../../../shared/ui/Input'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const POR_PAGINA = 8

export function CatalogoPage() {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [pagina, setPagina] = useState(0)
  const search = useDebounce(busqueda.trim())

  const { data: categorias } = useCategorias()
  const { data, isPending, isError, error, refetch, isFetching } = useProductos({
    skip: pagina * POR_PAGINA, // paginación en el servidor
    limit: POR_PAGINA,
    search: search || undefined,
    categoria_id: categoriaId,
    disponible: soloDisponibles ? true : undefined,
  })

  const totalPaginas = data ? Math.ceil(data.total / POR_PAGINA) : 0
  const hayFiltros = Boolean(busqueda || categoriaId || soloDisponibles)

  const limpiar = () => {
    setBusqueda('')
    setCategoriaId(undefined)
    setSoloDisponibles(false)
    setPagina(0)
  }

  return (
    <>
      <TituloPagina titulo="Catálogo" subtitulo="Elegí tus comidas favoritas y armá tu pedido." />

      <div className="mb-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200 sm:grid-cols-[1fr_220px_auto_auto] sm:items-end">
        <Input
          id="buscar"
          label="Buscar"
          placeholder="Ej: pizza, empanada…"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPagina(0)
          }}
        />
        <Select
          id="categoria"
          label="Categoría"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
            setPagina(0)
          }}
        >
          <option value="">Todas</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 pb-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-orange-600"
            checked={soloDisponibles}
            onChange={(e) => {
              setSoloDisponibles(e.target.checked)
              setPagina(0)
            }}
          />
          Solo disponibles
        </label>
        <Button variante="fantasma" onClick={limpiar} disabled={!hayFiltros}>
          Limpiar
        </Button>
      </div>

      {isPending ? (
        <SkeletonTarjetas cantidad={POR_PAGINA} />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          descripcion={hayFiltros ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
          accion={hayFiltros ? <Button onClick={limpiar}>Limpiar filtros</Button> : undefined}
        />
      ) : (
        <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={data.total} onCambiar={setPagina} />
        </div>
      )}
    </>
  )
}
