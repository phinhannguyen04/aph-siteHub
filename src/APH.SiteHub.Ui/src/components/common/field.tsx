'use client'
import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from 'react'
import { cx } from '@/lib/cx'

type Base = {
  label: string
  error?: boolean
  helperText?: ReactNode
  className?: string
}

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-base-content/80">
      {label}
      {required && (
        <span className="text-error" aria-hidden>
          {' '}
          *
        </span>
      )}
    </label>
  )
}

function Helper({ id, error, children }: { id: string; error?: boolean; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className={cx('mt-1.5 text-xs', error ? 'text-error' : 'text-base-content/60')}>
      {children}
    </p>
  )
}

export type FieldProps = Base & {
  /** Rendered inside the input frame before / after the text. */
  start?: ReactNode
  end?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>

export function Field({
  label,
  error,
  helperText,
  start,
  end,
  className,
  id,
  required,
  readOnly,
  ...input
}: FieldProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      <Label id={fid} label={label} required={required} />
      <div className={cx('input w-full', error && 'input-error', readOnly && 'bg-base-200')}>
        {start}
        <input
          id={fid}
          required={required}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={helperText ? `${fid}-help` : undefined}
          className="min-w-0 grow"
          {...input}
        />
        {end}
      </div>
      <Helper id={`${fid}-help`} error={error}>
        {helperText}
      </Helper>
    </div>
  )
}

export function TextArea({
  label,
  error,
  helperText,
  className,
  id,
  required,
  ...input
}: Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      <Label id={fid} label={label} required={required} />
      <textarea
        id={fid}
        required={required}
        aria-invalid={!!error}
        aria-describedby={helperText ? `${fid}-help` : undefined}
        className={cx('textarea w-full', error && 'textarea-error')}
        {...input}
      />
      <Helper id={`${fid}-help`} error={error}>
        {helperText}
      </Helper>
    </div>
  )
}

export function SelectField({
  label,
  className,
  id,
  children,
  ...select
}: Omit<Base, 'error' | 'helperText'> &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      <Label id={fid} label={label} />
      <select id={fid} className="select w-full" {...select}>
        {children}
      </select>
    </div>
  )
}
