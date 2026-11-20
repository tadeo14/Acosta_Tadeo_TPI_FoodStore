import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import * as authApi from '../features/auth/api/auth'
import type { LoginPayload, Rol, UserPublic } from '../features/auth/types'
import { registrarManejadorSesionInvalida } from '../shared/api/axiosInstance'
import { queryClient } from '../shared/api/queryClient'

/** Datos de sesión que se guardan en el cliente. Nunca el token. */
export interface UsuarioSesion {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
}

interface AuthState {
  usuario: UsuarioSesion | null
  cargando: boolean
  login: (payload: LoginPayload) => Promise<UsuarioSesion>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiarSesion: () => void
}

function aSesion(u: UserPublic): UsuarioSesion {
  return { id: u.id, username: u.username, full_name: u.full_name, email: u.email, role: u.role }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (payload) => {
        await authApi.login(payload) // el backend setea la cookie HttpOnly
        const me = await authApi.getMe()
        const usuario = aSesion(me)
        set({ usuario, cargando: false })
        return usuario
      },

      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          set({ usuario: null })
          queryClient.removeQueries({ queryKey: ['pedidos'] })
          queryClient.removeQueries({ queryKey: ['usuarios'] })
        }
      },

      checkSession: async () => {
        set({ cargando: true })
        try {
          const me = await authApi.getMe()
          set({ usuario: aSesion(me), cargando: false })
        } catch {
          set({ usuario: null, cargando: false })
        }
      },

      limpiarSesion: () => {
        set({ usuario: null, cargando: false })
        queryClient.removeQueries({ queryKey: ['pedidos'] })
      },
    }),
    {
      name: 'foodstore-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ usuario: state.usuario }), // solo el usuario, nunca el token
    },
  ),
)

// El interceptor de Axios limpia la sesión ante un 401 o una cuenta desactivada.
registrarManejadorSesionInvalida(() => useAuthStore.getState().limpiarSesion())
