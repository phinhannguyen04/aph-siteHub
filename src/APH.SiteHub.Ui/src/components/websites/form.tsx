'use client'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, ErrorBox, Field, Modal, TagChip, TagSelect } from '@/components/common'
import { TagForm } from '@/components/tags/tag-form'
import { useTags, useWrite } from '@/lib/api/hooks'
import type { Tag, Website } from '@/lib/api/types'
import { websitePatch } from '@/lib/api/websites'
import { c } from '@/lib/copy'
import type { WebsiteErrors } from '@/lib/validation'
import { website as validate } from '@/lib/validation'
export function WebsiteForm({ website, onClose }: { website?: Website; onClose: () => void }) {
  const tags = useTags()
  const [name, setName] = useState(website?.name ?? '')
  const [url, setUrl] = useState(website?.url ?? '')
  const [selected, setSelected] = useState<Tag[]>(website?.tags ?? [])
  const [quick, setQuick] = useState(false)
  const [validation, setValidation] = useState<WebsiteErrors>({})
  const write = useWrite(['websites', 'count'])
  const input = { name: name.trim(), url: url.trim(), tag_ids: selected.map((t) => t.id) }
  const patch = website ? websitePatch(website, input) : input
  const move = (index: number, offset: number) =>
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
            <Button className="btn-ghost" onClick={onClose} disabled={write.pending}>
              {c.cancel}
            </Button>
            <Button
              type="submit"
              className="btn-primary"
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
          error={!!validation.url}
          helperText={validation.url}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
        />
        <TagSelect
          inline
          label={c.tagPicker}
          tags={tags.data?.tags ?? []}
          value={selected}
          onChange={setSelected}
          error={!!validation.tag_ids}
          helperText={validation.tag_ids}
        />
        {selected.length > 1 && (
          <ol className="list rounded-box border border-base-300">
            {selected.map((t, i) => (
              <li key={t.id} className="list-row items-center py-1.5">
                <span className="w-5 text-center text-xs text-base-content/50 tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <TagChip tag={t} />
                </div>
                <div className="flex">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label={`${c.up}: ${t.name}`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label={`${c.down}: ${t.name}`}
                    disabled={i === selected.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <Button className="btn-ghost btn-sm self-start" onClick={() => setQuick(true)}>
          <Plus size={16} aria-hidden />
          {c.quickTag}
        </Button>
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
