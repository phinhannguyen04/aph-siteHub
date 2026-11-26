import { Check, X } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { tagTextColor } from './utils'

/** Static chip, removable chip (`onDelete`) or toggle chip (`onPressedChange`). */
export function TagChip({ tag, onDelete, pressed, onPressedChange }) {
  const style = { backgroundColor: tag.color, color: tagTextColor(tag.color) }
  if (onPressedChange) {
    return (
      <Toggle
        pressed={pressed}
        onPressedChange={onPressedChange}
        className="chip chip-toggle"
        style={style}
      >
        {pressed && <Check size={11} aria-hidden />}
        <span>{tag.name}</span>
      </Toggle>
    )
  }
  return (
    <span className="chip" style={style}>
      <span>{tag.name}</span>
      {onDelete && (
        <button type="button" aria-label={`Remove ${tag.name}`} onClick={onDelete}>
          <X size={11} />
        </button>
      )}
    </span>
  )
}
