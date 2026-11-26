import { TagChip } from '@/components/ui'
import { c } from '@/lib/copy'

/** Tag toggles that wrap onto new rows; `children` (e.g. a clear button) stays at the end of the row. */
export function TagFilter({ tags, selectedIds, onToggle, children }) {
  if (!tags?.length) return null
  return (
    <div className="tag-filter">
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
      {children && <div className="tag-filter-action">{children}</div>}
    </div>
  )
}
