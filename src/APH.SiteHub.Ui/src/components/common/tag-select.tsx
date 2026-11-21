'use client'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { type KeyboardEvent, useId, useState } from 'react'
import type { Tag } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'
import { Helper, inputFrame } from './field'
import { TagChip } from './tag-chip'

/** Multi-select tag combobox (Headless UI); `value` order is preserved as the selection order. */
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
  const [term, setTerm] = useState('')
  const needle = term.trim().toLowerCase()
  const options = tags.filter((t) => t.name.toLowerCase().includes(needle))
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !term && value.length) onChange(value.slice(0, -1))
  }
  return (
    <Combobox
      as="div"
      multiple
      immediate
      by="id"
      value={value}
      onChange={onChange}
      onClose={() => setTerm('')}
      className={cx('relative', className)}
    >
      <ComboboxLabel className="mb-1.5 block text-sm font-medium text-base-content/80">
        {label}
      </ComboboxLabel>
      <div className={inputFrame(error, 'h-auto min-h-10 py-1')}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {value.map((t) => (
            <TagChip
              key={t.id}
              tag={t}
              onDelete={() => onChange(value.filter((v) => v.id !== t.id))}
            />
          ))}
          <ComboboxInput
            aria-invalid={!!error}
            aria-describedby={helperText ? `${id}-help` : undefined}
            autoComplete="off"
            className="h-7 min-w-24 flex-1 bg-transparent outline-none focus-visible:outline-none"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <ComboboxButton className="shrink-0 opacity-50" aria-hidden>
          <ChevronDown size={16} />
        </ComboboxButton>
      </div>
      <ComboboxOptions
        className={cx(
          'flex w-full flex-col overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg',
          inline ? 'mt-1 max-h-48' : 'absolute z-30 mt-1 max-h-64',
        )}
      >
        {options.length === 0 && (
          <p className="px-3 py-2 text-sm text-base-content/60">{c.noTagOptions}</p>
        )}
        {options.map((t) => (
          <ComboboxOption
            key={t.id}
            value={t}
            className="group flex cursor-pointer items-center gap-2 rounded-field px-3 py-1.5 text-sm data-focus:bg-base-200"
          >
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: t.color }}
              aria-hidden
            />
            <span className="flex-1 truncate">{t.name}</span>
            <Check
              size={14}
              className="invisible text-primary group-data-selected:visible"
              aria-hidden
            />
          </ComboboxOption>
        ))}
      </ComboboxOptions>
      {helperText && (
        <Helper id={`${id}-help`} error={error}>
          {helperText}
        </Helper>
      )}
    </Combobox>
  )
}
