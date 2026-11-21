import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

const soft = {
  error: 'border-error/30 bg-error/10 text-error',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  success: 'border-success/30 bg-success/10 text-success',
}
const solid = {
  error: 'border-transparent bg-error text-error-content',
  warning: 'border-transparent bg-warning text-warning-content',
  success: 'border-transparent bg-success text-success-content',
}

export function Alert({
  tone,
  solid: isSolid = false,
  className,
  children,
  ...props
}: {
  tone: 'error' | 'warning' | 'success'
  solid?: boolean
  className?: string
  children: ReactNode
  role?: 'alert' | 'status'
}) {
  const style = (isSolid ? solid : soft)[tone]
  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-box border px-4 py-3 text-sm',
        style,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
