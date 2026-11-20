import { useForm } from '@tanstack/react-form'

import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { errorDeCampo, Input } from '../../../shared/ui/Input'
import type { Producto, ProductoStockUpdate } from '../types'

interface StockFormProps {
  producto: Producto
  onGuardar: (datos: ProductoStockUpdate) => Promise<void>
  onCancelar: () => void
  error: string | null
}

export function StockForm({ producto, onGuardar, onCancelar, error }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: producto.stock, disponible: producto.disponible },
    onSubmit: async ({ value }) => onGuardar(value),
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => (!Number.isInteger(value) || value < 0 ? 'Entero mayor o igual a 0' : undefined),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Input
              id={field.name}
              label="Stock"
              type="number"
              min={0}
              step={1}
              value={Number.isNaN(field.state.value) ? '' : field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
              error={errorDeCampo(field.state.meta)}
            />
            <div className="flex gap-1.5">
              {[-10, -1, 1, 10].map((delta) => (
                <Button
                  key={delta}
                  variante="secundario"
                  tamano="sm"
                  onClick={() => field.handleChange(Math.max(0, (Number.isNaN(field.state.value) ? 0 : field.state.value) + delta))}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </Button>
              ))}
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-600"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      <AlertaError mensaje={error} />

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting}>
              Actualizar stock
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
