import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { Rol } from '../features/auth/types'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  roles?: Rol[]
}

/**
 * Sin sesión → /login (recordando a dónde quería ir); sin el rol → /unauthorized.
 * La protección real está en el backend (require_role); esto solo mejora la UX.
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex justify-center py-24" aria-label="Verificando sesión">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}
