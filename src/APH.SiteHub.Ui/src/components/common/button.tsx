'use client'
import {
  Button as HeadlessButton,
  type ButtonProps as HeadlessButtonProps,
} from '@headlessui/react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Spinner } from './spinner'

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md'

const variants: Record<ButtonVariant, string> = {
  default: 'border-base-300 bg-base-200 enabled:hover:bg-base-300',
  primary: 'border-transparent bg-primary text-primary-content enabled:hover:bg-primary/90',
  ghost: 'border-transparent bg-transparent enabled:hover:bg-base-content/10',
  outline: 'border-base-content/30 bg-transparent enabled:hover:bg-base-content/10',
  danger: 'border-transparent bg-error text-error-content enabled:hover:bg-error/90',
}

const sizes: Record<ButtonSize, { text: string; box: string; square: string }> = {
  xs: { text: 'h-6 gap-1 text-xs', box: 'px-2', square: 'w-6' },
  sm: { text: 'h-8 gap-1.5 text-[0.8125rem]', box: 'px-3', square: 'w-8' },
  md: { text: 'h-10 gap-2 text-sm', box: 'px-4', square: 'w-10' },
}

/** Class names shared by real buttons and button-looking elements (links, disabled placeholders). */
export function buttonClass({
  variant = 'default',
  size = 'md',
  square = false,
  block = false,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  square?: boolean
  block?: boolean
} = {}) {
  const s = sizes[size]
  return cx(
    'inline-flex shrink-0 items-center justify-center rounded-field border font-semibold whitespace-nowrap transition-colors select-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    s.text,
    square ? s.square : s.box,
    block && 'w-full',
  )
}

export type ButtonProps = Omit<HeadlessButtonProps, 'className' | 'children'> & {
  className?: string
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  square?: boolean
  block?: boolean
  loading?: boolean
}

export function Button({
  loading = false,
  disabled,
  className,
  children,
  variant,
  size,
  square,
  block,
  ...props
}: ButtonProps) {
  return (
    <HeadlessButton
      className={cx(buttonClass({ variant, size, square, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </HeadlessButton>
  )
}
