import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Paginacion } from './Paginacion'

interface TablaDatosProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  filtroGlobal?: string
  porPagina?: number
  vacio?: string
}

/** Tabla del panel: ordenamiento, filtro y paginación del lado del cliente con TanStack Table. */
export function TablaDatos<T>({ data, columns, filtroGlobal = '', porPagina = 10, vacio = 'Sin resultados' }: TablaDatosProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filtroGlobal },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: porPagina } },
    autoResetPageIndex: true,
  })

  const filas = table.getRowModel().rows

  return (
    <div>
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const ordenable = header.column.getCanSort()
                  const orden = header.column.getIsSorted()
                  return (
                    <th key={header.id} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!ordenable}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`inline-flex items-center gap-1 uppercase ${ordenable ? 'cursor-pointer hover:text-stone-800' : 'cursor-default'}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : null}
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-stone-500">
                  {vacio}
                </td>
              </tr>
            ) : (
              filas.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Paginacion
        pagina={table.getState().pagination.pageIndex}
        totalPaginas={table.getPageCount()}
        total={table.getFilteredRowModel().rows.length}
        onCambiar={(p) => table.setPageIndex(p)}
      />
    </div>
  )
}
