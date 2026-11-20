import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { TablaDatos } from '../../../shared/components/TablaDatos'
import { TituloPagina } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import { useCategorias, useEliminarCategoria, useGuardarCategoria } from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types'

type EstadoForm = { abierto: false } | { abierto: true; categoria: Categoria | null }

export function AdminCategoriasPage() {
  const { data, isPending, isError, error, refetch } = useCategorias()
  const guardar = useGuardarCategoria()
  const eliminar = useEliminarCategoria()

  const [form, setForm] = useState<EstadoForm>({ abierto: false })
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  const abrir = (categoria: Categoria | null) => {
    setErrorForm(null)
    setForm({ abierto: true, categoria })
  }

  const onGuardar = async (datos: CategoriaCreate) => {
    if (!form.abierto) return
    setErrorForm(null)
    try {
      await guardar.mutateAsync({ id: form.categoria?.id ?? null, datos })
      setForm({ abierto: false })
    } catch (e) {
      setErrorForm(handleApiError(e))
    }
  }

  const onEliminar = async () => {
    if (!aEliminar) return
    setErrorEliminar(null)
    try {
      await eliminar.mutateAsync(aEliminar.id)
      setAEliminar(null)
    } catch (e) {
      setErrorEliminar(handleApiError(e))
    }
  }

  const columnas = useMemo<ColumnDef<Categoria, unknown>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'nombre', header: 'Nombre', cell: (c) => <span className="font-medium">{String(c.getValue())}</span> },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: (c) => <span className="text-stone-600">{(c.getValue() as string | null) ?? '—'}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1.5">
            <Button variante="secundario" tamano="sm" onClick={() => abrir(row.original)}>
              Editar
            </Button>
            <Button variante="peligro" tamano="sm" onClick={() => setAEliminar(row.original)}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <TituloPagina titulo="Categorías" subtitulo="Alta, edición y baja lógica de categorías.">
        <div className="flex items-end gap-2">
          <Input id="filtro-cat" placeholder="Filtrar…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          <Button onClick={() => abrir(null)}>+ Nueva categoría</Button>
        </div>
      </TituloPagina>

      {isPending ? (
        <SkeletonFilas />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos data={data} columns={columnas} filtroGlobal={filtro} vacio="No hay categorías" />
      )}

      <Modal
        abierto={form.abierto}
        titulo={form.abierto && form.categoria ? `Editar "${form.categoria.nombre}"` : 'Nueva categoría'}
        onCerrar={() => setForm({ abierto: false })}
      >
        {form.abierto && (
          <CategoriaForm
            key={form.categoria?.id ?? 'nueva'}
            inicial={form.categoria}
            onGuardar={onGuardar}
            onCancelar={() => setForm({ abierto: false })}
            error={errorForm}
          />
        )}
      </Modal>

      <Modal abierto={aEliminar !== null} titulo="Eliminar categoría" onCerrar={() => setAEliminar(null)}>
        <p className="text-sm text-stone-600">
          ¿Dar de baja la categoría <strong>{aEliminar?.nombre}</strong>? Es una baja lógica: el nombre sigue reservado y sus
          productos no se ocultan (si querés retirarlos del catálogo, dalos de baja también).
        </p>
        <div className="mt-4">
          <AlertaError mensaje={errorEliminar} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setAEliminar(null)}>
            Volver
          </Button>
          <Button variante="peligro" cargando={eliminar.isPending} onClick={() => void onEliminar()}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  )
}
