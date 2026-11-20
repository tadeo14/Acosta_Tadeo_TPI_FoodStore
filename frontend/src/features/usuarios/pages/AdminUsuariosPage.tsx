import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { formatearFecha } from '../../../shared/utils/formato'
import { useAuthStore } from '../../../store/authStore'
import type { UserPublic } from '../../auth/types'
import { useCambiarEstadoUsuario, useUsuarios } from '../hooks/useUsuarios'

export function AdminUsuariosPage() {
  const { data, isPending, isError, error, refetch } = useUsuarios()
  const cambiarEstado = useCambiarEstadoUsuario()
  const idSesion = useAuthStore((s) => s.usuario?.id)
  const [filtro, setFiltro] = useState('')
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const columnas = useMemo<ColumnDef<UserPublic, unknown>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'username', header: 'Usuario', cell: (c) => <span className="font-medium">@{String(c.getValue())}</span> },
      { accessorKey: 'full_name', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: (c) =>
          c.getValue() === 'admin' ? (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">Admin</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">Cliente</span>
          ),
      },
      {
        accessorKey: 'disabled',
        header: 'Estado',
        cell: (c) =>
          c.getValue() ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Desactivado</span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Activo</span>
          ),
      },
      { accessorKey: 'created_at', header: 'Alta', cell: (c) => formatearFecha(String(c.getValue())) },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          const esYo = u.id === idSesion
          const enCurso = cambiarEstado.isPending && cambiarEstado.variables?.id === u.id
          const ejecutar = (activar: boolean) => {
            setErrorAccion(null)
            cambiarEstado.mutate({ id: u.id, activar }, { onError: (e) => setErrorAccion(handleApiError(e)) })
          }
          if (u.disabled) {
            return (
              <Button variante="exito" tamano="sm" cargando={enCurso} onClick={() => ejecutar(true)}>
                Activar
              </Button>
            )
          }
          // El botón Desactivar no se muestra en la fila del usuario de la sesión
          return esYo ? (
            <span className="text-xs text-stone-400">(vos)</span>
          ) : (
            <Button variante="peligro" tamano="sm" cargando={enCurso} onClick={() => ejecutar(false)}>
              Desactivar
            </Button>
          )
        },
      },
    ],
    [idSesion, cambiarEstado],
  )

  return (
    <>
      <TituloPagina titulo="Usuarios" subtitulo="Activá o desactivá cuentas (baja lógica).">
        <Input id="filtro-usr" placeholder="Filtrar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      </TituloPagina>

      <div className="mb-4">
        <AlertaError mensaje={errorAccion} />
      </div>

      {isPending ? (
        <SkeletonFilas />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos data={data} columns={columnas} filtroGlobal={filtro} vacio="No hay usuarios" />
      )}
    </>
  )
}
