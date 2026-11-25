import { Check, CircleAlert, Copy as CopyIcon, Eye, EyeOff, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { c } from '@/lib/copy'
import { useNotice } from './notice'

export const cx = (...values) => values.filter(Boolean).join(' ')

export function Spinner() {
  return <span className="spinner" role="status" aria-label={c.loading} />
}

export function Busy() {
  return (
    <div className="busy">
      <Spinner />
    </div>
  )
}

export function Button({
  variant = 'default',
  size,
  icon = false,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'btn',
        variant !== 'default' && `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        icon && 'btn-icon',
        className,
      )}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </button>
  )
}

export function Field({ label, error, helperText, className, ...props }) {
  const id = useId()
  return (
    <div className={cx('field', className)}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        aria-invalid={error || undefined}
        aria-describedby={helperText ? `${id}-help` : undefined}
        {...props}
      />
      {helperText && (
        <p id={`${id}-help`} className={cx('help', error && 'error')}>
          {helperText}
        </p>
      )}
    </div>
  )
}

export function TextArea({ label, error, helperText, ...props }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className="textarea"
        aria-invalid={error || undefined}
        aria-describedby={helperText ? `${id}-help` : undefined}
        {...props}
      />
      {helperText && (
        <p id={`${id}-help`} className={cx('help', error && 'error')}>
          {helperText}
        </p>
      )}
    </div>
  )
}

export function Select({ label, className, children, ...props }) {
  return (
    <select className={cx('select', className)} aria-label={label} {...props}>
      {children}
    </select>
  )
}

export function SearchBox({ label, value, onChange, placeholder }) {
  return (
    <div className="search">
      <Search size={16} aria-hidden />
      <input
        type="search"
        className="input"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function Toggle({ label, checked, onChange, className }) {
  return (
    <label className={cx('toggle', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function PasswordField({ label, error, helperText, ...props }) {
  const [shown, setShown] = useState(false)
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type={shown ? 'text' : 'password'}
          aria-invalid={error || undefined}
          aria-describedby={helperText ? `${id}-help` : undefined}
          autoCapitalize="off"
          spellCheck={false}
          {...props}
        />
        <Button
          variant="ghost"
          size="sm"
          icon
          aria-label={shown ? c.hidePassword : c.showPassword}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
        >
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
      {helperText && (
        <p id={`${id}-help`} className={cx('help', error && 'error')}>
          {helperText}
        </p>
      )}
    </div>
  )
}

export function Badge({ tone, children }) {
  return <span className={cx('badge', tone)}>{children}</span>
}

export function ErrorBox({ error, retry }) {
  if (!error) return null
  return (
    <div className="alert" role="alert">
      <CircleAlert size={18} aria-hidden />
      <span>{error.message}</span>
      {retry && (
        <Button variant="ghost" size="sm" onClick={retry}>
          {c.retry}
        </Button>
      )}
    </div>
  )
}

export function Empty({ title, body, action }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  )
}

/** Copies text to the clipboard and reports the outcome in a toast. */
export function CopyButton({ value, label }) {
  const notify = useNotice()
  return (
    <Button
      variant="ghost"
      size="sm"
      icon
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          notify(c.copied)
        } catch {
          notify(c.copyFailed, 'error')
        }
      }}
    >
      <CopyIcon size={15} />
    </Button>
  )
}

export function localDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Readable text colour (black or white) for a `#rrggbb` background. */
export function tagTextColor(color) {
  const n = Number.parseInt(color.slice(1), 16)
  const luminance = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff'
}

export function TagChip({ tag, onDelete, pressed, onClick }) {
  const style = { backgroundColor: tag.color, color: tagTextColor(tag.color) }
  if (onClick) {
    return (
      <button
        type="button"
        className="chip chip-filter"
        style={{ ...style, color: tagTextColor(tag.color) }}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {pressed && <Check size={12} aria-hidden />}
        <span>{tag.name}</span>
      </button>
    )
  }
  return (
    <span className="chip" style={style}>
      <span>{tag.name}</span>
      {onDelete && (
        <button type="button" aria-label={`Remove ${tag.name}`} onClick={onDelete}>
          <X size={12} />
        </button>
      )}
    </span>
  )
}

/** Native `<dialog>` modal: focus trap, Escape and backdrop-click close come from the browser. */
export function Modal({ title, onClose, onSubmit, actions, children, variant }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])
  const body = (
    <>
      <div className="modal-head">
        <h2>{title}</h2>
        {onClose && (
          <Button variant="ghost" size="sm" icon aria-label={c.close} onClick={onClose}>
            <X size={18} />
          </Button>
        )}
      </div>
      <div className="modal-body">{children}</div>
      {actions && <div className="modal-foot">{actions}</div>}
    </>
  )
  return (
    <dialog
      ref={ref}
      className={cx('modal', variant)}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose?.()
      }}
    >
      {onSubmit ? (
        <form className="modal-form" onSubmit={onSubmit} noValidate>
          {body}
        </form>
      ) : (
        <div className="modal-form">{body}</div>
      )}
    </dialog>
  )
}

/** Confirmation dialog; `requireText` makes the user type a value before the action enables. */
export function Confirm({ title, body, requireText, action, pending, error, onConfirm, onClose }) {
  const [typed, setTyped] = useState('')
  return (
    <Modal
      title={title}
      onClose={pending ? undefined : onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {c.cancel}
          </Button>
          <Button
            variant="danger"
            loading={pending}
            disabled={requireText !== undefined && typed !== requireText}
            onClick={onConfirm}
          >
            {action}
          </Button>
        </>
      }
    >
      <ErrorBox error={error} />
      <p>{body}</p>
      {requireText !== undefined && (
        <Field label={c.confirmLogin} value={typed} onChange={(e) => setTyped(e.target.value)} />
      )}
    </Modal>
  )
}
export const buttonLink = 'btn btn-primary'
