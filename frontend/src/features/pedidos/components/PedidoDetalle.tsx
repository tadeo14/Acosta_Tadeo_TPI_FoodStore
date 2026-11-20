import type { ReactNode } from 'react'

import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato'
import type { Pedido } from '../types'

export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <Dato etiqueta="Estado">
          <BadgeEstado estado={pedido.estado} />
        </Dato>
        <Dato etiqueta="Forma de pago">{pedido.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</Dato>
        <Dato etiqueta="Creado">{formatearFecha(pedido.created_at)}</Dato>
        <Dato etiqueta="Última actualización">{formatearFecha(pedido.updated_at)}</Dato>
        <Dato etiqueta="Dirección de entrega" ancho>
          {pedido.direccion_entrega}
        </Dato>
        {pedido.notas && (
          <Dato etiqueta="Notas" ancho>
            {pedido.notas}
          </Dato>
        )}
      </div>

      <table className="w-full text-left">
        <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-right">Precio</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {pedido.items.map((l) => (
            <tr key={l.producto_id}>
              <td className="py-2 text-stone-800">{l.nombre_producto}</td>
              <td className="py-2 text-right text-stone-600">{formatearPrecio(l.precio_unitario)}</td>
              <td className="py-2 text-right text-stone-600">{l.cantidad}</td>
              <td className="py-2 text-right font-medium">{formatearPrecio(l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-stone-200">
            <td colSpan={3} className="py-2 text-right font-semibold">
              Total
            </td>
            <td className="py-2 text-right text-base font-bold text-orange-700">{formatearPrecio(pedido.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function Dato({ etiqueta, children, ancho = false }: { etiqueta: string; children: ReactNode; ancho?: boolean }) {
  return (
    <div className={ancho ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-stone-500">{etiqueta}</p>
      <div className="text-stone-800">{children}</div>
    </div>
  )
}
