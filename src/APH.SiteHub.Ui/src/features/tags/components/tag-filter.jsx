import { TagChip } from '@/components/ui'
import { c } from '@/lib/copy'

export function TagFilter({ tags, selectedIds, onToggle }) {
  if (!tags?.length) return null
  return (
    <fieldset className="chips">
      <legend className="sr-only">{c.filterTags}</legend>
      {tags.map((t) => (
        <TagChip
          key={t.id}
          tag={t}
          pressed={selectedIds.includes(t.id)}
          onPressedChange={() => onToggle(t.id)}
        />
      ))}
    </fieldset>
  )
}
