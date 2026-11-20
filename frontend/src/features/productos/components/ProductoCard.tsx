import { useState } from 'react'

import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { formatearPrecio } from '../../../shared/utils/formato'
import { useCartStore } from '../../../store/cartStore'
import type { Producto } from '../types'

interface ProductoCardProps {
  producto: Producto
}

export function ProductoCard({ producto }: ProductoCardProps) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)
  const [imagenRota, setImagenRota] = useState(false)

  const sinStock = producto.stock <= 0
  const puedeAgregar = producto.disponible && !sinStock && enCarrito < producto.stock

  const textoBoton = !producto.disponible
    ? 'No disponible'
    : sinStock
      ? 'Sin stock'
      : enCarrito >= producto.stock
        ? 'Máximo en carrito'
        : 'Agregar al carrito'

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-stone-100">
        {producto.imagen_url && !imagenRota ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            onError={() => setImagenRota(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🍔</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700">
          {producto.categoria.nombre}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-stone-900">{producto.nombre}</h3>
        {producto.descripcion && <p className="mt-1 line-clamp-2 text-sm text-stone-500">{producto.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-lg font-bold text-orange-700">{formatearPrecio(producto.precio_base)}</span>
          <span className={`text-xs ${producto.stock <= 5 ? 'text-red-600' : 'text-stone-500'}`}>Stock: {producto.stock}</span>
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!puedeAgregar}
          onClick={() =>
            agregar({
              producto_id: producto.id,
              nombre: producto.nombre,
              precio_unitario: producto.precio_base,
              imagen_url: producto.imagen_url,
            })
          }
        >
          {textoBoton}
          {enCarrito > 0 && puedeAgregar && <span className="text-xs opacity-80">({enCarrito})</span>}
        </Button>
      </div>
    </Card>
  )
}
