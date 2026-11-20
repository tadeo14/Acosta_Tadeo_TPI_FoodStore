const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatearPrecio(valor: number): string {
  return formatoPrecio.format(valor)
}

export function formatearFecha(iso: string): string {
  return formatoFecha.format(new Date(iso))
}
