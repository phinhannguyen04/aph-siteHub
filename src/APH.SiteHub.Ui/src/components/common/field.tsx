import { Field as HeadlessField, Label as HeadlessLabel, Switch } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
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

const labelClass = 'mb-1.5 block text-sm font-medium text-base-content/80'
const control =
  'rounded-field border bg-base-100 text-sm text-base-content transition-colors placeholder:text-base-content/40'
const normal = 'border-base-300'
const invalid = 'border-error'
const focusRing = 'focus-within:outline-2 focus-within:outline-offset-2'
const ringNormal = 'focus-within:outline-primary'
const ringInvalid = 'focus-within:outline-error'

/** Frame shared by text inputs and the tag picker: children (chips, inputs, icons) sit inside it. */
export const inputFrame = (error?: boolean, extra?: string) =>
  cx(
    control,
    'flex w-full items-center gap-2 px-3',
    focusRing,
    error ? cx(invalid, ringInvalid) : cx(normal, ringNormal),
    extra,
  )

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className={labelClass}>
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

export function Helper({
  id,
  error,
  children,
}: {
  id: string
  error?: boolean
  children?: ReactNode
}) {
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
      <div className={inputFrame(error, cx('h-10', readOnly && 'bg-base-200'))}>
        {start}
        <input
          id={fid}
          required={required}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={helperText ? `${fid}-help` : undefined}
          className="h-full min-w-0 grow bg-transparent outline-none focus-visible:outline-none"
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
        className={cx(
          control,
          'block w-full px-3 py-2',
          error ? invalid : normal,
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          error ? 'focus-visible:outline-error' : 'focus-visible:outline-primary',
        )}
        {...input}
      />
      <Helper id={`${fid}-help`} error={error}>
        {helperText}
      </Helper>
    </div>
  )
}

/** Styled native <select>: keeps platform pickers and form semantics. */
export function SelectBox({
  size = 'md',
  icon,
  className,
  children,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'size'> & {
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('relative', className)}>
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center opacity-60">
          {icon}
        </span>
      )}
      <select
        className={cx(
          control,
          normal,
          'block w-full appearance-none pe-9',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          size === 'sm' ? 'h-8 text-[0.8125rem]' : 'h-10',
          icon ? 'ps-9' : 'ps-3',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 opacity-60"
        aria-hidden
      />
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
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'size'>) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      <Label id={fid} label={label} />
      <SelectBox id={fid} {...select}>
        {children}
      </SelectBox>
    </div>
  )
}

/** Labelled on/off switch built on Headless UI `Switch`. */
export function ToggleField({
  label,
  checked,
  onChange,
  className,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <HeadlessField className={cx('flex items-center gap-3', className)}>
      <Switch
        checked={checked}
        onChange={onChange}
        className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-base-content/25 transition-colors data-checked:bg-warning"
      >
        <span className="size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform group-data-checked:translate-x-[1.375rem] rtl:-translate-x-0.5 rtl:group-data-checked:-translate-x-[1.375rem]" />
      </Switch>
      <HeadlessLabel className="cursor-pointer text-sm font-medium">{label}</HeadlessLabel>
    </HeadlessField>
  )
}
