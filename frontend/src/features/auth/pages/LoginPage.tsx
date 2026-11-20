import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { errorDeCampo, Input } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'

interface EstadoNavegacion {
  from?: string
}

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const usuarioActual = useAuthStore((s) => s.usuario)
  const cargandoSesion = useAuthStore((s) => s.cargando)
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as EstadoNavegacion | null)?.from
  const [errorApi, setErrorApi] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setErrorApi(null)
      try {
        const usuario = await login(value)
        navigate(destino ?? (usuario.role === 'admin' ? '/admin/resumen' : '/'), { replace: true })
      } catch (error) {
        setErrorApi(handleApiError(error))
      }
    },
  })

  if (!cargandoSesion && usuarioActual) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-sm pt-6">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-stone-900">Ingresar</h1>
        <p className="mt-1 text-sm text-stone-500">Accedé con tu usuario para hacer pedidos.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu usuario') }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={errorDeCampo(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'Ingresá tu contraseña') }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={errorDeCampo(field.state.meta)}
              />
            )}
          </form.Field>

          <AlertaError mensaje={errorApi} />

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-orange-600 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
