import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">Sin permiso</h1>
      <p className="mt-2 text-stone-500">No tenés permisos para ver esta sección.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
