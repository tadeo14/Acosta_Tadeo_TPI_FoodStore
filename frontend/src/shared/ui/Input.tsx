import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const BASE =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-stone-900 ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-stone-100'

interface CampoProps {
  label?: string
  error?: string
  id: string
}

function Campo({ label, error, id, children }: CampoProps & { children: ReactNode }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

type InputProps = CampoProps & InputHTMLAttributes<HTMLInputElement>

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  return (
    <Campo label={label} error={error} id={id}>
      <input id={id} className={`${BASE} ${error ? 'ring-red-400' : ''} ${className}`} {...rest} />
    </Campo>
  )
}

type SelectProps = CampoProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }

export function Select({ label, error, id, className = '', children, ...rest }: SelectProps) {
  return (
    <Campo label={label} error={error} id={id}>
      <select id={id} className={`${BASE} ${error ? 'ring-red-400' : ''} ${className}`} {...rest}>
        {children}
      </select>
    </Campo>
  )
}

type TextareaProps = CampoProps & TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ label, error, id, className = '', ...rest }: TextareaProps) {
  return (
    <Campo label={label} error={error} id={id}>
      <textarea id={id} rows={3} className={`${BASE} ${error ? 'ring-red-400' : ''} ${className}`} {...rest} />
    </Campo>
  )
}

/** Primer error de un campo de TanStack Form, sólo si el usuario ya lo tocó. */
export function errorDeCampo(meta: { isTouched: boolean; errors: unknown[] }): string | undefined {
  if (!meta.isTouched || meta.errors.length === 0) return undefined
  const primero = meta.errors[0]
  return typeof primero === 'string' ? primero : undefined
}
