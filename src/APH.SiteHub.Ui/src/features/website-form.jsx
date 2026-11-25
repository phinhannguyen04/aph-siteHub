import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, ErrorBox, Field, Modal, TagChip } from '@/components/ui'
import { websitePatch } from '@/lib/api'
import { c } from '@/lib/copy'
import { useTags, useWrite } from '@/lib/hooks'
import { website as validate } from '@/lib/validation'
import { TagForm } from './tags-manager'

export function WebsiteForm({ website, onClose }) {
  const tags = useTags()
  const [name, setName] = useState(website?.name ?? '')
  const [url, setUrl] = useState(website?.url ?? '')
  const [selected, setSelected] = useState(website?.tags ?? [])
  const [quick, setQuick] = useState(false)
  const [validation, setValidation] = useState({})
  const write = useWrite(['websites', 'count'])
  const input = { name: name.trim(), url: url.trim(), tag_ids: selected.map((t) => t.id) }
  const patch = website ? websitePatch(website, input) : input
  const ids = new Set(input.tag_ids)
  const toggle = (tag) =>
    setSelected((old) => (ids.has(tag.id) ? old.filter((t) => t.id !== tag.id) : [...old, tag]))
  const move = (index, offset) =>
    setSelected((values) => {
      const next = [...values]
      ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
      return next
    })
  return (
    <>
      <Modal
        title={website ? c.editWebsite : c.addWebsite}
        onClose={write.pending ? undefined : onClose}
        onSubmit={(e) => {
          e.preventDefault()
          const error = validate(name, url, input.tag_ids)
          setValidation(error)
          if (Object.keys(error).length) return
          void write.run(
            website ? `/api/websites/${website.id}` : '/api/websites',
            website ? 'PATCH' : 'POST',
            patch,
            onClose,
          )
        }}
        actions={
          <>
            <Button variant="ghost" onClick={onClose} disabled={write.pending}>
              {c.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={write.pending}
              disabled={website && Object.keys(patch).length === 0}
            >
              {website ? c.save : c.create}
            </Button>
          </>
        }
      >
        <ErrorBox error={write.error} />
        <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
        <Field
          autoFocus
          required
          label={c.name}
          error={!!validation.name}
          helperText={validation.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          required
          label={c.url}
          type="url"
          inputMode="url"
          placeholder="https://"
          error={!!validation.url}
          helperText={validation.url}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="field">
          <span className="label">{c.tagPicker}</span>
          <fieldset className="tag-pick">
            <legend className="sr-only">{c.tagPicker}</legend>
            {tags.data?.tags.length === 0 && <span className="help">{c.noTags}</span>}
            {tags.data?.tags.map((t) => (
              <TagChip key={t.id} tag={t} pressed={ids.has(t.id)} onClick={() => toggle(t)} />
            ))}
            <Button variant="ghost" size="sm" onClick={() => setQuick(true)}>
              <Plus size={14} aria-hidden />
              {c.quickTag}
            </Button>
          </fieldset>
          {validation.tag_ids && <p className="help error">{validation.tag_ids}</p>}
        </div>
        {selected.length > 1 && (
          <ol className="order">
            {selected.map((t, i) => (
              <li key={t.id}>
                <span className="n">{i + 1}</span>
                <div className="chips">
                  <TagChip tag={t} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon
                  aria-label={`${c.up}: ${t.name}`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon
                  aria-label={`${c.down}: ${t.name}`}
                  disabled={i === selected.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={14} />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </Modal>
      {quick && (
        <TagForm
          onClose={() => setQuick(false)}
          onCreated={(tag) => setSelected((old) => (old.length < 50 ? [...old, tag] : old))}
        />
      )}
    </>
  )
}
