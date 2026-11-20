import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productosKeys } from '../../productos/hooks/useProductos'
import { cambiarEstadoPedido, cancelarPedido, crearPedido, getPedidos, getResumenPedidos } from '../api/pedidos'
import type { EstadoPedido, FiltrosPedidos, PedidoCreate } from '../types'

export const pedidosKeys = {
  all: ['pedidos'] as const,
  lista: (filtros: FiltrosPedidos) => ['pedidos', 'lista', filtros] as const,
  resumen: ['pedidos', 'resumen'] as const,
}

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: pedidosKeys.lista(filtros),
    queryFn: () => getPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: pedidosKeys.resumen, queryFn: getResumenPedidos })
}

/** Pedidos y stock cambian juntos: se invalidan ambos. */
function useInvalidarPedidosYStock() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: pedidosKeys.all })
    void qc.invalidateQueries({ queryKey: productosKeys.all })
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: (payload: PedidoCreate) => crearPedido(payload),
    onSuccess: invalidar,
  })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, estado),
    onSuccess: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: (id: number) => cancelarPedido(id),
    onSuccess: invalidar,
  })
}
