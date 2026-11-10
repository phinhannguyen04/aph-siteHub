'use client'
import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

export function Button({
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={cx('btn', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-sm" aria-hidden />}
      {children}
    </button>
  )
}
