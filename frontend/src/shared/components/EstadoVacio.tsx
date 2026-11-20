import type { ReactNode } from 'react'

interface EstadoVacioProps {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export function EstadoVacio({ titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        🍽️
      </div>
      <h3 className="text-base font-semibold text-stone-800">{titulo}</h3>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-stone-500">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}
