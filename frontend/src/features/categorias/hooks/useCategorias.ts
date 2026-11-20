import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { actualizarCategoria, crearCategoria, eliminarCategoria, getCategorias } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types'

export const categoriasKeys = {
  all: ['categorias'] as const,
}

export function useCategorias() {
  return useQuery({ queryKey: categoriasKeys.all, queryFn: getCategorias })
}

export function useGuardarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number | null; datos: CategoriaCreate | CategoriaUpdate }) =>
      id === null ? crearCategoria(datos as CategoriaCreate) : actualizarCategoria(id, datos),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoriasKeys.all })
      void qc.invalidateQueries({ queryKey: ['productos'] }) // los productos muestran su categoría
    },
  })
}

export function useEliminarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoriasKeys.all })
    },
  })
}
