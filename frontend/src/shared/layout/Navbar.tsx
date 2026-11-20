import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const linkClase = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-orange-50 text-orange-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0))
  const navigate = useNavigate()

  const cerrarSesion = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 flex items-center gap-2 text-lg font-bold text-stone-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">F</span>
          Food Store
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClase}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={linkClase}>
            Carrito
            {cantidad > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-600 px-1.5 py-0.5 text-xs text-white">{cantidad}</span>
            )}
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={linkClase}>
              Mis pedidos
            </NavLink>
          )}
          {usuario?.role === 'admin' && (
            <>
              <span className="mx-2 h-5 w-px bg-stone-200" />
              <NavLink to="/admin/resumen" className={linkClase}>
                Resumen
              </NavLink>
              <NavLink to="/admin/pedidos" className={linkClase}>
                Pedidos
              </NavLink>
              <NavLink to="/admin/productos" className={linkClase}>
                Productos
              </NavLink>
              <NavLink to="/admin/categorias" className={linkClase}>
                Categorías
              </NavLink>
              <NavLink to="/admin/usuarios" className={linkClase}>
                Usuarios
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-stone-800">{usuario.full_name}</p>
                <p className="text-xs text-stone-500">
                  {usuario.role === 'admin' ? 'Administrador' : 'Cliente'} · @{usuario.username}
                </p>
              </div>
              <button
                onClick={cerrarSesion}
                className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-300 hover:bg-stone-100"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClase}>
                Ingresar
              </NavLink>
              <Link to="/register" className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
