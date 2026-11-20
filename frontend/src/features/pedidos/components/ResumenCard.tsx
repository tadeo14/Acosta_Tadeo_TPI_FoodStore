import { Card } from '../../../shared/ui/Card'

interface ResumenCardProps {
  titulo: string
  valor: string | number
  icono: string
  acento: string // clases de color para el ícono
}

export function ResumenCard({ titulo, valor, icono, acento }: ResumenCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${acento}`}>{icono}</div>
      <div>
        <p className="text-sm text-stone-500">{titulo}</p>
        <p className="text-2xl font-bold text-stone-900">{valor}</p>
      </div>
    </Card>
  )
}
