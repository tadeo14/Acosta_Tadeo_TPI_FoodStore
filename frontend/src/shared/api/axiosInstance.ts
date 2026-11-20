import axios, { AxiosError } from 'axios'

export const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

/**
 * Cliente HTTP único. withCredentials: true hace que el navegador adjunte
 * la cookie HttpOnly `access_token` en cada petición. El frontend nunca
 * lee ni guarda el token.
 */
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

type ManejadorSesionInvalida = () => void
let onSesionInvalida: ManejadorSesionInvalida | null = null

/** El authStore registra aquí cómo limpiar la sesión (evita dependencias circulares). */
export function registrarManejadorSesionInvalida(fn: ManejadorSesionInvalida): void {
  onSesionInvalida = fn
}

const RUTAS_SIN_INTERCEPTAR = ['/auth/token', '/auth/me']

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const detail = error.response?.data?.detail

    const es401 = status === 401 && !RUTAS_SIN_INTERCEPTAR.some((ruta) => url.endsWith(ruta))
    const esCuentaDesactivada = status === 400 && detail === CUENTA_DESACTIVADA

    if ((es401 || esCuentaDesactivada) && onSesionInvalida) {
      // Limpia el authStore; ProtectedRoute redirige a /login al quedar sin usuario.
      onSesionInvalida()
    }
    return Promise.reject(error)
  },
)
