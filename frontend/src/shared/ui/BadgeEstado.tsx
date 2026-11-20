import type { EstadoPedido } from '../../features/pedidos/types'

const ESTILOS: Record<EstadoPedido, { clase: string; texto: string }> = {
  PENDIENTE: { clase: 'bg-amber-100 text-amber-800 ring-amber-200', texto: 'Pendiente' },
  EN_PREPARACION: { clase: 'bg-sky-100 text-sky-800 ring-sky-200', texto: 'En preparación' },
  ENTREGADO: { clase: 'bg-emerald-100 text-emerald-800 ring-emerald-200', texto: 'Entregado' },
  CANCELADO: { clase: 'bg-red-100 text-red-800 ring-red-200', texto: 'Cancelado' },
}

export function etiquetaEstado(estado: EstadoPedido): string {
  return ESTILOS[estado].texto
}

export function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  const { clase, texto } = ESTILOS[estado]
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${clase}`}>{texto}</span>
}
