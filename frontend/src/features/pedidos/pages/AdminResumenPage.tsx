import { Link } from 'react-router-dom'

import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { formatearPrecio } from '../../../shared/utils/formato'
import { ResumenCard } from '../components/ResumenCard'
import { useResumenPedidos } from '../hooks/usePedidos'

export function AdminResumenPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useResumenPedidos()

  return (
    <>
      <TituloPagina titulo="Resumen del negocio" subtitulo="Indicadores de los pedidos.">
        <Button variante="secundario" onClick={() => void refetch()} cargando={isFetching}>
          Actualizar
        </Button>
      </TituloPagina>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumenCard titulo="Pendientes" valor={data.pendientes} icono="⏳" acento="bg-amber-100" />
          <ResumenCard titulo="En preparación" valor={data.en_preparacion} icono="👨‍🍳" acento="bg-sky-100" />
          <ResumenCard titulo="Entregados" valor={data.entregados} icono="✅" acento="bg-emerald-100" />
          <ResumenCard titulo="Cancelados" valor={data.cancelados} icono="✖️" acento="bg-red-100" />
          <ResumenCard titulo="Pedidos de hoy" valor={data.pedidos_hoy} icono="📅" acento="bg-violet-100" />
          <ResumenCard
            titulo="Ingresos (entregados)"
            valor={formatearPrecio(data.ingresos_entregados)}
            icono="💰"
            acento="bg-orange-100"
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/pedidos" className="text-sm font-medium text-orange-600 hover:underline">
          Gestionar pedidos →
        </Link>
        <Link to="/admin/productos" className="text-sm font-medium text-orange-600 hover:underline">
          Gestionar productos →
        </Link>
      </div>
    </>
  )
}
