import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { BadgeEstado, etiquetaEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Select } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ESTADOS_PEDIDO, TRANSICIONES, type EstadoPedido, type Pedido } from '../types'

interface CambioPendiente {
  pedido: Pedido
  estado: EstadoPedido
}

export function AdminPedidosPage() {
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | undefined>(undefined)
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const [cambio, setCambio] = useState<CambioPendiente | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data, isPending, isError, error: errorQuery, refetch } = usePedidos({ skip: 0, limit: 100, estado: filtroEstado })
  const { data: usuarios } = useUsuarios()
  const cambiarEstado = useCambiarEstadoPedido()

  const nombreCliente = useMemo(() => {
    const mapa = new Map<number, string>((usuarios ?? []).map((u) => [u.id, `@${u.username}`]))
    return (id: number) => mapa.get(id) ?? `#${id}`
  }, [usuarios])

  const confirmarCambio = async () => {
    if (!cambio) return
    setError(null)
    try {
      await cambiarEstado.mutateAsync({ id: cambio.pedido.id, estado: cambio.estado })
      setCambio(null)
      setDetalle(null)
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const columnas = useMemo<ColumnDef<Pedido, unknown>[]>(
    () => [
      { accessorKey: 'id', header: '#', cell: (c) => <span className="font-medium">#{String(c.getValue())}</span> },
      { accessorKey: 'created_at', header: 'Fecha', cell: (c) => formatearFecha(String(c.getValue())) },
      { id: 'cliente', header: 'Cliente', accessorFn: (p) => nombreCliente(p.usuario_id) },
      {
        id: 'items',
        header: 'Ítems',
        enableSorting: false,
        accessorFn: (p) => p.items.map((l) => `${l.cantidad}× ${l.nombre_producto}`).join(', '),
        cell: (c) => <span className="line-clamp-1 max-w-56 text-stone-600">{String(c.getValue())}</span>,
      },
      { accessorKey: 'forma_pago', header: 'Pago' },
      { accessorKey: 'total', header: 'Total', cell: (c) => <span className="font-semibold">{formatearPrecio(Number(c.getValue()))}</span> },
      { accessorKey: 'estado', header: 'Estado', cell: (c) => <BadgeEstado estado={c.getValue() as EstadoPedido} /> },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex flex-wrap gap-1.5">
              <Button variante="fantasma" tamano="sm" onClick={() => setDetalle(p)}>
                Ver
              </Button>
              {TRANSICIONES[p.estado].map((destino) => (
                <Button
                  key={destino}
                  tamano="sm"
                  variante={destino === 'CANCELADO' ? 'peligro' : destino === 'ENTREGADO' ? 'exito' : 'primario'}
                  onClick={() => setCambio({ pedido: p, estado: destino })}
                >
                  {destino === 'CANCELADO' ? 'Cancelar' : `→ ${etiquetaEstado(destino)}`}
                </Button>
              ))}
            </div>
          )
        },
      },
    ],
    [nombreCliente],
  )

  return (
    <>
      <TituloPagina titulo="Pedidos" subtitulo="Avanzá o cancelá los pedidos según la máquina de estados.">
        <div className="w-56">
          <Select
            id="filtro-estado"
            label="Filtrar por estado"
            value={filtroEstado ?? ''}
            onChange={(e) => setFiltroEstado((e.target.value || undefined) as EstadoPedido | undefined)}
          >
            <option value="">Todos</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {etiquetaEstado(e)}
              </option>
            ))}
          </Select>
        </div>
      </TituloPagina>

      {isPending ? (
        <SkeletonFilas filas={6} />
      ) : isError ? (
        <EstadoError error={errorQuery} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos data={data.items} columns={columnas} vacio="No hay pedidos con ese estado" />
      )}

      <Modal abierto={detalle !== null} titulo={`Pedido #${detalle?.id ?? ''}`} onCerrar={() => setDetalle(null)} ancho="lg">
        {detalle && (
          <>
            <p className="mb-4 text-sm text-stone-500">Cliente: {nombreCliente(detalle.usuario_id)}</p>
            <PedidoDetalle pedido={detalle} />
            {TRANSICIONES[detalle.estado].length > 0 && (
              <div className="mt-6 flex justify-end gap-2">
                {TRANSICIONES[detalle.estado].map((destino) => (
                  <Button
                    key={destino}
                    variante={destino === 'CANCELADO' ? 'peligro' : 'primario'}
                    onClick={() => setCambio({ pedido: detalle, estado: destino })}
                  >
                    {destino === 'CANCELADO' ? 'Cancelar pedido' : `Pasar a ${etiquetaEstado(destino)}`}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        abierto={cambio !== null}
        titulo="Confirmar cambio de estado"
        onCerrar={() => {
          setCambio(null)
          setError(null)
        }}
      >
        {cambio && (
          <p className="text-sm text-stone-600">
            Pedido #{cambio.pedido.id}: <BadgeEstado estado={cambio.pedido.estado} /> → <BadgeEstado estado={cambio.estado} />
            {cambio.estado === 'CANCELADO' && (
              <span className="mt-2 block text-stone-500">Se va a restituir el stock de todos los productos del pedido.</span>
            )}
          </p>
        )}
        <div className="mt-4">
          <AlertaError mensaje={error} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setCambio(null)}>
            Volver
          </Button>
          <Button
            variante={cambio?.estado === 'CANCELADO' ? 'peligro' : 'primario'}
            cargando={cambiarEstado.isPending}
            onClick={() => void confirmarCambio()}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </>
  )
}
