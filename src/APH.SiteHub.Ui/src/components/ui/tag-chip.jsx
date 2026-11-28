import { Check, X } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import { tagTextColor } from './utils'

/** Wrapping row that holds one or more chips. */
export const chipsClass = 'm-0 flex min-w-0 flex-wrap gap-1.5 border-0 p-0'

const chip =
  'inline-flex max-w-full items-center gap-0.5 rounded-md border-0 px-2 py-0.5 text-xs font-semibold whitespace-nowrap'
const label = 'overflow-hidden text-ellipsis'

/** Static chip, removable chip (`onDelete`) or toggle chip (`onPressedChange`). */
export function TagChip({ tag, onDelete, pressed, onPressedChange }) {
  const style = { backgroundColor: tag.color, color: tagTextColor(tag.color) }
  if (onPressedChange) {
    return (
      <Toggle
        pressed={pressed}
        onPressedChange={onPressedChange}
        className={cn(
          chip,
          'cursor-pointer opacity-55 transition-opacity duration-200 hover:opacity-85 data-[state=on]:opacity-100 data-[state=on]:shadow-[0_0_0_2px_var(--surface-muted),0_0_0_4px_var(--accent)]',
        )}
        style={style}
      >
        {pressed && <Check size={11} aria-hidden />}
        <span className={label}>{tag.name}</span>
      </Toggle>
    )
  }
  return (
    <span className={chip} style={style}>
      <span className={label}>{tag.name}</span>
      {onDelete && (
        <button
          type="button"
          className="grid cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit"
          aria-label={`Remove ${tag.name}`}
          onClick={onDelete}
        >
          <X size={11} />
        </button>
      )}
    </span>
  )
}
