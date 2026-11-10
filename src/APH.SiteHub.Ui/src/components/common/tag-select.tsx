'use client'
import { Check, ChevronDown } from 'lucide-react'
import { type KeyboardEvent, useId, useState } from 'react'
import type { Tag } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'
import { TagChip } from './tag-chip'

/** Multi-select tag combobox; `value` order is preserved as the selection order. */
export function TagSelect({
  label,
  tags,
  value,
  onChange,
  error,
  helperText,
  inline = false,
  className,
}: {
  label: string
  tags: Tag[]
  value: Tag[]
  onChange: (tags: Tag[]) => void
  error?: boolean
  helperText?: string
  /** Render the option list in the flow (inside dialogs) instead of floating. */
  inline?: boolean
  className?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(0)
  const options = tags.filter((t) => t.name.toLowerCase().includes(term.trim().toLowerCase()))
  const selected = new Set(value.map((t) => t.id))
  const toggle = (tag: Tag) =>
    onChange(selected.has(tag.id) ? value.filter((t) => t.id !== tag.id) : [...value, tag])
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault()
      toggle(options[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'Backspace' && !term && value.length) {
      onChange(value.slice(0, -1))
    }
  }
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: focus-out tracking only, not an interaction
    <div
      className={cx('relative', className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
      </label>
      <div className={cx('input h-auto min-h-[var(--size)] w-full py-1', error && 'input-error')}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {value.map((t) => (
            <TagChip key={t.id} tag={t} onDelete={() => toggle(t)} />
          ))}
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-invalid={!!error}
            aria-describedby={helperText ? `${id}-help` : undefined}
            aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
            autoComplete="off"
            className="h-7 min-w-24 flex-1"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              setActive(0)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
        </div>
        <ChevronDown size={16} className="shrink-0 opacity-50" aria-hidden />
      </div>
      {open && (
        <div
          id={`${id}-list`}
          role="listbox"
          aria-multiselectable
          aria-label={label}
          className={cx(
            'flex w-full flex-col overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg',
            inline ? 'mt-1 max-h-48' : 'absolute z-30 mt-1 max-h-64',
          )}
        >
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-base-content/60">{c.noTagOptions}</p>
          )}
          {options.map((t, i) => (
            <div
              key={t.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={selected.has(t.id)}
              tabIndex={-1}
              className={cx(
                'flex cursor-pointer flex-row items-center gap-2 rounded-field px-3 py-1.5 text-sm',
                i === active && 'bg-base-200',
              )}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => toggle(t)}
              onKeyDown={() => {}}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: t.color }}
                aria-hidden
              />
              <span className="flex-1 truncate">{t.name}</span>
              {selected.has(t.id) && <Check size={14} className="text-primary" aria-hidden />}
            </div>
          ))}
        </div>
      )}
      {helperText && (
        <p
          id={`${id}-help`}
          className={cx('mt-1.5 text-xs', error ? 'text-error' : 'text-base-content/60')}
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
