import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { actualizarProducto, actualizarStock, crearProducto, eliminarProducto, getProductos } from '../api/productos'
import type { FiltrosProductos, ProductoCreate, ProductoStockUpdate, ProductoUpdate } from '../types'

export const productosKeys = {
  all: ['productos'] as const,
  lista: (filtros: FiltrosProductos) => ['productos', filtros] as const,
}

export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: productosKeys.lista(filtros),
    queryFn: () => getProductos(filtros),
    placeholderData: keepPreviousData, // evita parpadeo al cambiar de página
  })
}

function useInvalidarProductos() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: productosKeys.all })
}

export function useGuardarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number | null; datos: ProductoCreate | ProductoUpdate }) =>
      id === null ? crearProducto(datos as ProductoCreate) : actualizarProducto(id, datos),
    onSuccess: () => void invalidar(),
  })
}

export function useActualizarStock() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoStockUpdate }) => actualizarStock(id, datos),
    onSuccess: () => void invalidar(),
  })
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: (id: number) => eliminarProducto(id),
    onSuccess: () => void invalidar(),
  })
}
