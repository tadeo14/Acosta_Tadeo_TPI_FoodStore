import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div className={`rounded-xl bg-white shadow-sm ring-1 ring-stone-200 ${className}`} {...rest}>
      {children}
    </div>
  )
}
