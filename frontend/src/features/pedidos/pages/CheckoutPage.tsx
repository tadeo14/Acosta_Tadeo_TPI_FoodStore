import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Card } from '../../../shared/ui/Card'
import { formatearPrecio } from '../../../shared/utils/formato'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm, type DatosCheckout } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore((s) => s.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0 && !crearPedido.isSuccess) return <Navigate to="/carrito" replace />

  const confirmar = async (datos: DatosCheckout) => {
    setError(null)
    try {
      await crearPedido.mutateAsync({
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        forma_pago: datos.forma_pago,
        direccion_entrega: datos.direccion_entrega.trim(),
        notas: datos.notas.trim() || null,
      })
      vaciar()
      navigate('/mis-pedidos', { replace: true, state: { creado: true } })
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  return (
    <>
      <TituloPagina titulo="Confirmar pedido" subtitulo="Indicá dónde lo llevamos y cómo vas a pagar." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <CheckoutForm onConfirmar={confirmar} error={error} />
        </Card>

        <Card className="h-fit p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Tu pedido</h2>
            <Link to="/carrito" className="text-sm text-orange-600 hover:underline">
              Editar
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-2">
                <span className="text-stone-700">
                  {i.cantidad} × {i.nombre}
                </span>
                <span className="font-medium text-stone-900">{formatearPrecio(i.precio_unitario * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-stone-100 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatearPrecio(total)}</span>
          </div>
        </Card>
      </div>
    </>
  )
}
