import { useForm } from '@tanstack/react-form'

import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { errorDeCampo, Input, Textarea } from '../../../shared/ui/Input'
import type { Categoria, CategoriaCreate } from '../types'

interface CategoriaFormProps {
  inicial: Categoria | null
  onGuardar: (datos: CategoriaCreate) => Promise<void>
  onCancelar: () => void
  error: string | null
}

export function CategoriaForm({ inicial, onGuardar, onCancelar, error }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      await onGuardar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null })
    },
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
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const n = value.trim().length
            return n < 2 ? 'Mínimo 2 caracteres' : n > 100 ? 'Máximo 100 caracteres' : undefined
          },
        }}
      >
        {(field) => (
          <Input
            id={field.name}
            label="Nombre"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field.state.meta)}
          />
        )}
      </form.Field>
      <form.Field name="descripcion">
        {(field) => (
          <Textarea
            id={field.name}
            label="Descripción"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
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
              {inicial ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
