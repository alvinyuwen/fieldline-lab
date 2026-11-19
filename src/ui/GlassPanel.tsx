import type { PropsWithChildren } from 'react'

interface GlassPanelProps extends PropsWithChildren {
  className?: string
  variant?: 'light' | 'dense'
  label?: string
}

export function GlassPanel({ children, className = '', variant = 'light', label }: GlassPanelProps) {
  return (
    <section
      className={`glass-panel glass-panel--${variant} ${className}`}
      aria-label={label}
    >
      {children}
    </section>
  )
}
