import { useQuery } from '@tanstack/react-query'
import { Check, Pencil, Pipette, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Confirm,
  ErrorBox,
  Field,
  Modal,
  TagChip,
  TextArea,
  tagTextColor,
} from '@/components/ui'
import { useWrite } from '@/hooks/use-write'
import { deleteTag, query } from '@/lib/api'
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
      <div className="swatches">
        {palette.map((value) => (
          <button
            type="button"
            key={value}
            className="swatch"
            aria-label={`${c.color} ${value}`}
            aria-pressed={color === value}
            style={{ backgroundColor: value, color: tagTextColor(value) }}
            onClick={() => setColor(value)}
          >
            {color === value && <Check size={14} aria-hidden />}
          </button>
        ))}
        <label className="swatch swatch-custom" title={c.customColor}>
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
        <div className="chips">
          <TagChip tag={{ name: tagName(name) || c.newTag, color }} />
        </div>
      )}
    </Modal>
  )
}

export function TagsManager({ onClose }) {
  const tags = useQuery({ queryKey: ['tags'], queryFn: () => query('/api/tags') })
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const write = useWrite(['tags', 'websites'])
  return (
    <>
      <Modal
        title={c.tags}
        variant="wide"
        onClose={onClose}
        actions={
          <>
            <Button variant="ghost" onClick={onClose}>
              {c.close}
            </Button>
            <Button variant="primary" onClick={() => setForm('new')}>
              <Plus size={16} aria-hidden />
              {c.newTag}
            </Button>
          </>
        }
      >
        <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
        {tags.data?.tags.length === 0 && <p className="help">{c.noTags}</p>}
        <ul className="list">
          {tags.data?.tags.map((t) => (
            <li key={t.id}>
              <div className="grow">
                <div className="chips">
                  <TagChip tag={t} />
                </div>
                {t.description && <p className="help">{t.description}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon
                aria-label={`${c.edit} ${t.name}`}
                onClick={() => setForm(t)}
              >
                <Pencil size={15} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon
                aria-label={`${c.delete} ${t.name}`}
                onClick={() => setDeleting(t)}
              >
                <Trash2 size={15} />
              </Button>
            </li>
          ))}
        </ul>
        {form && <TagForm tag={form === 'new' ? undefined : form} onClose={() => setForm(null)} />}
        {deleting && (
          <Confirm
            title={c.deleteTag}
            body={`${deleting.name}: ${c.tagWarning}`}
            action={c.delete}
            pending={write.pending}
            error={write.error}
            onClose={() => setDeleting(null)}
            onConfirm={() =>
              void write.runDelete(
                () => deleteTag(deleting.id),
                () => setDeleting(null),
              )
            }
          />
        )}
      </Modal>
    </>
  )
}
