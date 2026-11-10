'use client'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Busy, Button, Confirm, Empty, ErrorBox, Modal, TagChip } from '@/components/common'
import { useTags, useWrite } from '@/lib/api/hooks'
import type { Tag } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { TagForm } from './tag-form'

export function TagsManager({ onClose }: { onClose: () => void }) {
  const tags = useTags()
  const [form, setForm] = useState<Tag | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Tag | null>(null)
  const write = useWrite(['tags', 'websites'])
  return (
    <>
      <Modal
        title={c.tags}
        onClose={onClose}
        actions={
          <Button className="btn-ghost" onClick={onClose}>
            {c.close}
          </Button>
        }
      >
        <Button className="btn-primary btn-sm self-start" onClick={() => setForm('new')}>
          <Plus size={16} aria-hidden />
          {c.newTag}
        </Button>
        <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
        {tags.isPending ? (
          <Busy />
        ) : tags.data?.tags.length === 0 ? (
          <Empty title={c.noTags} body="" />
        ) : (
          <ul className="list rounded-box border border-base-300">
            {tags.data?.tags.map((tag) => (
              <li key={tag.id} className="list-row items-center">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <TagChip tag={tag} />
                  {tag.description && (
                    <p className="mt-1 text-sm text-base-content/70">{tag.description}</p>
                  )}
                </div>
                <div className="flex">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    aria-label={`${c.edit} ${tag.name}`}
                    onClick={() => setForm(tag)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square text-error"
                    aria-label={`${c.delete} ${tag.name}`}
                    onClick={() => setDeleting(tag)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
      {form && <TagForm tag={form === 'new' ? undefined : form} onClose={() => setForm(null)} />}
      {deleting && (
        <Confirm
          title={c.deleteTag}
          pending={write.pending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            void write.run(`/api/tags/${deleting.id}`, 'DELETE', undefined, () => setDeleting(null))
          }
        >
          <div>
            <TagChip tag={deleting} />
          </div>
          <p>{c.tagWarning}</p>
          <ErrorBox error={write.error} />
        </Confirm>
      )}
    </>
  )
}
