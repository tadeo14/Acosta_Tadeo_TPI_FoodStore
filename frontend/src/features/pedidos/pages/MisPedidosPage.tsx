import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Modal } from '../../../shared/ui/Modal'
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types'

const POR_PAGINA = 10

export function MisPedidosPage() {
  const [pagina, setPagina] = useState(0)
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null)
  const location = useLocation()
  const recienCreado = (location.state as { creado?: boolean } | null)?.creado === true

  const { data, isPending, isError, error, refetch } = usePedidos({ skip: pagina * POR_PAGINA, limit: POR_PAGINA })
  const cancelar = useCancelarPedido()

  const confirmarCancelacion = async () => {
    if (!aCancelar) return
    setErrorCancelar(null)
    try {
      await cancelar.mutateAsync(aCancelar.id)
      setACancelar(null)
      setSeleccionado(null)
    } catch (e) {
      setErrorCancelar(handleApiError(e))
    }
  }

  return (
    <>
      <TituloPagina titulo="Mis pedidos" subtitulo="Seguí el estado de tus pedidos." />

      {recienCreado && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          ✔ ¡Pedido creado! Lo vas a ver en estado Pendiente hasta que el local lo empiece a preparar.
        </div>
      )}

      {isPending ? (
        <SkeletonFilas filas={4} />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              Ver catálogo
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-32">
                  <p className="font-semibold text-stone-900">Pedido #{p.id}</p>
                  <p className="text-xs text-stone-500">{formatearFecha(p.created_at)}</p>
                </div>
                <BadgeEstado estado={p.estado} />
                <p className="flex-1 truncate text-sm text-stone-600">
                  {p.items.map((l) => `${l.cantidad}× ${l.nombre_producto}`).join(', ')}
                </p>
                <p className="font-bold text-stone-900">{formatearPrecio(p.total)}</p>
                <div className="flex gap-2">
                  <Button variante="secundario" tamano="sm" onClick={() => setSeleccionado(p)}>
                    Ver detalle
                  </Button>
                  {p.estado === 'PENDIENTE' && (
                    <Button variante="peligro" tamano="sm" onClick={() => setACancelar(p)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Paginacion
            pagina={pagina}
            totalPaginas={Math.ceil(data.total / POR_PAGINA)}
            total={data.total}
            onCambiar={setPagina}
          />
        </>
      )}

      <Modal abierto={seleccionado !== null} titulo={`Pedido #${seleccionado?.id ?? ''}`} onCerrar={() => setSeleccionado(null)} ancho="lg">
        {seleccionado && (
          <>
            <PedidoDetalle pedido={seleccionado} />
            {seleccionado.estado === 'PENDIENTE' && (
              <div className="mt-6 flex justify-end">
                <Button variante="peligro" onClick={() => setACancelar(seleccionado)}>
                  Cancelar pedido
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        abierto={aCancelar !== null}
        titulo="Cancelar pedido"
        onCerrar={() => {
          setACancelar(null)
          setErrorCancelar(null)
        }}
      >
        <p className="text-sm text-stone-600">
          ¿Seguro que querés cancelar el pedido #{aCancelar?.id}? Esta acción no se puede deshacer.
        </p>
        {errorCancelar && <p className="mt-3 text-sm text-red-600">{errorCancelar}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setACancelar(null)}>
            Volver
          </Button>
          <Button variante="peligro" cargando={cancelar.isPending} onClick={() => void confirmarCancelacion()}>
            Sí, cancelar
          </Button>
        </div>
      </Modal>
    </>
  )
}
