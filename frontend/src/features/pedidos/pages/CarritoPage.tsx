import { Link, useNavigate } from 'react-router-dom'

import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { formatearPrecio } from '../../../shared/utils/formato'
import { useAuthStore } from '../../../store/authStore'
import { useCartStore } from '../../../store/cartStore'

export function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <>
        <TituloPagina titulo="Carrito" />
        <EstadoVacio
          titulo="Tu carrito está vacío"
          descripcion="Agregá productos desde el catálogo para armar tu pedido."
          accion={
            <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              Ir al catálogo
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      <TituloPagina titulo="Carrito" subtitulo="Tu carrito se guarda aunque recargues la página.">
        <Button variante="fantasma" onClick={vaciar}>
          Vaciar carrito
        </Button>
      </TituloPagina>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item.producto_id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🍔</div>
                )}
              </div>
              <div className="min-w-40 flex-1">
                <p className="font-medium text-stone-900">{item.nombre}</p>
                <p className="text-sm text-stone-500">{formatearPrecio(item.precio_unitario)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variante="secundario"
                  tamano="sm"
                  aria-label="Restar"
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                >
                  −
                </Button>
                <input
                  type="number"
                  min={1}
                  aria-label={`Cantidad de ${item.nombre}`}
                  value={item.cantidad}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isInteger(n) && n >= 1) cambiarCantidad(item.producto_id, n)
                  }}
                  className="w-14 rounded-md px-2 py-1 text-center text-sm ring-1 ring-stone-300"
                />
                <Button
                  variante="secundario"
                  tamano="sm"
                  aria-label="Sumar"
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                >
                  +
                </Button>
              </div>
              <p className="w-28 text-right font-semibold text-stone-900">
                {formatearPrecio(item.precio_unitario * item.cantidad)}
              </p>
              <Button variante="fantasma" tamano="sm" onClick={() => quitar(item.producto_id)}>
                Quitar
              </Button>
            </div>
          ))}
        </Card>

        <Card className="h-fit space-y-4 p-5">
          <h2 className="font-semibold text-stone-900">Resumen</h2>
          <div className="flex justify-between text-sm text-stone-600">
            <span>Productos</span>
            <span>{items.reduce((a, i) => a + i.cantidad, 0)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-4 text-lg font-bold text-stone-900">
            <span>Total</span>
            <span>{formatearPrecio(total)}</span>
          </div>
          <p className="text-xs text-stone-500">
            El precio final y el stock se confirman al crear el pedido.
          </p>
          <Button className="w-full" onClick={() => navigate('/checkout')}>
            {usuario ? 'Confirmar pedido' : 'Ingresar para confirmar'}
          </Button>
        </Card>
      </div>
    </>
  )
}
