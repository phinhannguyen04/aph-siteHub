import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

const tones = {
  ghost: 'border border-base-300 bg-base-200 text-base-content',
  primary: 'bg-primary text-primary-content',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
}

export function Badge({
  tone = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: {
  tone?: keyof typeof tones
  size?: 'sm' | 'md'
  className?: string
  children: ReactNode
  'data-testid'?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium',
        size === 'sm' ? 'h-5 px-2 text-xs' : 'h-6 px-2.5 text-sm',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
