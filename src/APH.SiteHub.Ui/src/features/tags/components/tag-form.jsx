import { Check, Pipette } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  chipsClass,
  ErrorBox,
  Field,
  Modal,
  TagChip,
  TextArea,
  tagTextColor,
} from '@/components/ui'
import { useWrite } from '@/hooks/use-write'
import { c } from '@/lib/copy'
import { tagName, tag as validate } from '@/lib/validation'

const palette = ['#344e63', '#275f4c', '#825a20', '#8a3d51', '#62518b', '#226b80']
const hex = /^#[\da-f]{6}$/i

/** Create or edit a tag. `onCreated` receives the saved tag (used by the website form). */
export function TagForm({ tag, onClose, onCreated }) {
  const [name, setName] = useState(tag?.name ?? '')
  const [description, setDescription] = useState(tag?.description ?? '')
  const [color, setColor] = useState(tag?.color ?? palette[0])
  const [validation, setValidation] = useState({})
  const write = useWrite(['tags', 'websites'])
  return (
    <Modal
      title={tag ? c.editTag : c.newTag}
      onClose={write.pending ? undefined : onClose}
      onSubmit={(e) => {
        e.preventDefault()
        const error = validate(name, description, color)
        setValidation(error)
        if (Object.keys(error).length) return
        void write.run(
          tag ? `/api/tags/${tag.id}` : '/api/tags',
          tag ? 'PATCH' : 'POST',
          { name: tagName(name), description: description.trim(), color },
          (data) => {
            onCreated?.(data.tag)
            onClose()
          },
        )
      }}
      actions={
        <>
          <Button variant="ghost" disabled={write.pending} onClick={onClose}>
            {c.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={write.pending}>
            {tag ? c.save : c.create}
          </Button>
        </>
      }
    >
      <ErrorBox error={write.error} />
      <Field
        autoFocus
        required
        label={c.name}
        error={!!validation.name}
        helperText={validation.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextArea
        label={c.description}
        rows={2}
        error={!!validation.description}
        helperText={validation.description ?? `${description.length}/240`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {palette.map((value) => (
          <button
            type="button"
            key={value}
            className="grid size-6 cursor-pointer place-items-center rounded-md border-0 aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-ink"
            aria-label={`${c.color} ${value}`}
            aria-pressed={color === value}
            style={{ backgroundColor: value, color: tagTextColor(value) }}
            onClick={() => setColor(value)}
          >
            {color === value && <Check size={14} aria-hidden />}
          </button>
        ))}
        <label
          className="relative grid size-6 cursor-pointer place-items-center rounded-md bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] text-white drop-shadow-[0_0_1px_#000] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          title={c.customColor}
        >
          <input
            type="color"
            className="sr-only"
            aria-label={c.customColor}
            value={hex.test(color) ? color.toLowerCase() : palette[0]}
            onChange={(e) => setColor(e.target.value)}
          />
          <Pipette size={14} aria-hidden />
        </label>
      </div>
      <Field
        label={c.color}
        error={!!validation.color}
        helperText={validation.color}
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      {hex.test(color) && (
        <div className={chipsClass}>
          <TagChip tag={{ name: tagName(name) || c.newTag, color }} />
        </div>
      )}
    </Modal>
  )
}
