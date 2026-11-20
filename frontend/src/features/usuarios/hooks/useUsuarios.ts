import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activarUsuario, desactivarUsuario, getUsuarios } from '../api/usuarios'

export const usuariosKeys = {
  all: ['usuarios'] as const,
}

export function useUsuarios() {
  return useQuery({ queryKey: usuariosKeys.all, queryFn: getUsuarios })
}

export function useCambiarEstadoUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? activarUsuario(id) : desactivarUsuario(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: usuariosKeys.all })
    },
  })
}
