import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { formatearPrecio } from '../../../shared/utils/formato'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { StockForm } from '../components/StockForm'
import { useActualizarStock, useEliminarProducto, useGuardarProducto, useProductos } from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types'

type Dialogo =
  | { tipo: 'ninguno' }
  | { tipo: 'form'; producto: Producto | null }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }

export function AdminProductosPage() {
  // El panel pide hasta 100 productos y pagina del lado del cliente con TanStack Table
  const { data, isPending, isError, error, refetch } = useProductos({ skip: 0, limit: 100 })
  const { data: categorias = [] } = useCategorias()
  const guardar = useGuardarProducto()
  const actualizarStock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const [dialogo, setDialogo] = useState<Dialogo>({ tipo: 'ninguno' })
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  const abrir = (d: Dialogo) => {
    setErrorDialogo(null)
    setDialogo(d)
  }
  const cerrar = () => setDialogo({ tipo: 'ninguno' })

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setErrorDialogo(null)
    try {
      await accion()
      cerrar()
    } catch (e) {
      setErrorDialogo(handleApiError(e))
    }
  }

  const onGuardar = (datos: ProductoCreate) =>
    ejecutar(() => guardar.mutateAsync({ id: dialogo.tipo === 'form' ? (dialogo.producto?.id ?? null) : null, datos }))

  const onStock = (datos: ProductoStockUpdate) =>
    dialogo.tipo === 'stock' ? ejecutar(() => actualizarStock.mutateAsync({ id: dialogo.producto.id, datos })) : Promise.resolve()

  const columnas = useMemo<ColumnDef<Producto, unknown>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'nombre',
        header: 'Producto',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-stone-100">
              {row.original.imagen_url && <img src={row.original.imagen_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="font-medium">{row.original.nombre}</span>
          </div>
        ),
      },
      { id: 'categoria', header: 'Categoría', accessorFn: (p) => p.categoria.nombre },
      { accessorKey: 'precio_base', header: 'Precio', cell: (c) => formatearPrecio(Number(c.getValue())) },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: (c) => {
          const s = Number(c.getValue())
          return <span className={s === 0 ? 'font-semibold text-red-600' : s <= 5 ? 'text-amber-600' : ''}>{s}</span>
        },
      },
      {
        accessorKey: 'disponible',
        header: 'Disponible',
        cell: (c) =>
          c.getValue() ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Sí</span>
          ) : (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700">No</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1.5">
            <Button variante="secundario" tamano="sm" onClick={() => abrir({ tipo: 'form', producto: row.original })}>
              Editar
            </Button>
            <Button variante="secundario" tamano="sm" onClick={() => abrir({ tipo: 'stock', producto: row.original })}>
              Stock
            </Button>
            <Button variante="peligro" tamano="sm" onClick={() => abrir({ tipo: 'eliminar', producto: row.original })}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <TituloPagina titulo="Productos" subtitulo="ABM de productos, stock y disponibilidad.">
        <div className="flex items-end gap-2">
          <Input id="filtro-prod" placeholder="Filtrar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          <Button onClick={() => abrir({ tipo: 'form', producto: null })} disabled={categorias.length === 0}>
            + Nuevo producto
          </Button>
        </div>
      </TituloPagina>

      {isPending ? (
        <SkeletonFilas filas={8} />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos data={data.items} columns={columnas} filtroGlobal={filtro} vacio="No hay productos" />
      )}

      <Modal
        abierto={dialogo.tipo === 'form'}
        titulo={dialogo.tipo === 'form' && dialogo.producto ? `Editar "${dialogo.producto.nombre}"` : 'Nuevo producto'}
        onCerrar={cerrar}
        ancho="lg"
      >
        {dialogo.tipo === 'form' && (
          <ProductoForm
            key={dialogo.producto?.id ?? 'nuevo'}
            inicial={dialogo.producto}
            categorias={categorias}
            onGuardar={onGuardar}
            onCancelar={cerrar}
            error={errorDialogo}
          />
        )}
      </Modal>

      <Modal
        abierto={dialogo.tipo === 'stock'}
        titulo={dialogo.tipo === 'stock' ? `Stock de "${dialogo.producto.nombre}"` : ''}
        onCerrar={cerrar}
      >
        {dialogo.tipo === 'stock' && (
          <StockForm
            key={dialogo.producto.id}
            producto={dialogo.producto}
            onGuardar={onStock}
            onCancelar={cerrar}
            error={errorDialogo}
          />
        )}
      </Modal>

      <Modal abierto={dialogo.tipo === 'eliminar'} titulo="Eliminar producto" onCerrar={cerrar}>
        {dialogo.tipo === 'eliminar' && (
          <>
            <p className="text-sm text-stone-600">
              ¿Dar de baja <strong>{dialogo.producto.nombre}</strong>? Deja de mostrarse en el catálogo; los pedidos existentes
              conservan su nombre y precio.
            </p>
            <div className="mt-4">
              <AlertaError mensaje={errorDialogo} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variante="secundario" onClick={cerrar}>
                Volver
              </Button>
              <Button
                variante="peligro"
                cargando={eliminar.isPending}
                onClick={() => void ejecutar(() => eliminar.mutateAsync(dialogo.producto.id))}
              >
                Eliminar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
