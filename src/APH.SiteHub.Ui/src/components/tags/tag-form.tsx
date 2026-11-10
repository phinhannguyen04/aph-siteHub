'use client'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button, ErrorBox, Field, Modal, TagChip, TextArea } from '@/components/common'
import { tagTextColor } from '@/components/common/tag-chip'
import { useWrite } from '@/lib/api/hooks'
import type { Tag } from '@/lib/api/types'
import { c } from '@/lib/copy'
import type { TagErrors } from '@/lib/validation'
import { tagName, tag as validate } from '@/lib/validation'

const palette = ['#344e63', '#275f4c', '#825a20', '#8a3d51', '#62518b', '#226b80']
const hex = /^#[\da-f]{6}$/i

export function TagForm({
  tag,
  onClose,
  onCreated,
}: {
  tag?: Tag
  onClose: () => void
  onCreated?: (tag: Tag) => void
}) {
  const [name, setName] = useState(tag?.name ?? '')
  const [description, setDescription] = useState(tag?.description ?? '')
  const [color, setColor] = useState(tag?.color ?? palette[0])
  const [validation, setValidation] = useState<TagErrors>({})
  const write = useWrite(['tags', 'websites'])
  return (
    <Modal
      title={tag ? c.editTag : c.newTag}
      size="xs"
      onClose={write.pending ? undefined : onClose}
      onSubmit={(e) => {
        e.preventDefault()
        const error = validate(name, description, color)
        setValidation(error)
        if (Object.keys(error).length) return
        void write.run<{ tag: Tag }>(
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
          <Button className="btn-ghost" disabled={write.pending} onClick={onClose}>
            {c.cancel}
          </Button>
          <Button type="submit" className="btn-primary" loading={write.pending}>
            {tag ? c.save : c.create}
          </Button>
        </>
      }
    >
      <ErrorBox error={write.error} />
      <Field
        autoFocus
        label={c.name}
        error={!!validation.name}
        helperText={validation.name}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextArea
        label={c.description}
        error={!!validation.description}
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        helperText={validation.description ?? `${description.length}/240`}
      />
      <div className="flex flex-wrap gap-2">
        {palette.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${c.color} ${value}`}
            aria-pressed={color === value}
            onClick={() => setColor(value)}
            className="btn btn-circle btn-sm border-0 ring-offset-2 ring-offset-base-100 aria-pressed:ring-2 aria-pressed:ring-base-content"
            style={{ backgroundColor: value, color: tagTextColor(value) }}
          >
            {color === value && <Check size={14} aria-hidden />}
          </button>
        ))}
      </div>
      <Field
        label={c.color}
        error={!!validation.color}
        helperText={validation.color}
        value={color}
        onChange={(e) => setColor(e.target.value)}
        start={
          <span
            className="size-4 shrink-0 rounded border border-base-300"
            style={{ backgroundColor: hex.test(color) ? color : 'transparent' }}
            aria-hidden
          />
        }
      />
      {hex.test(color) && (
        <div>
          <TagChip tag={{ name: tagName(name) || c.newTag, color } as Tag} />
        </div>
      )}
    </Modal>
  )
}
