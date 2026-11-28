import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Confirm, chipsClass, ErrorBox, help, Modal, TagChip } from '@/components/ui'
import { useWrite } from '@/hooks/use-write'
import { deleteTag, query } from '@/lib/api'
import { c } from '@/lib/copy'
import { TagForm } from './tag-form'

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
        {tags.data?.tags.length === 0 && <p className={help}>{c.noTags}</p>}
        <ul className="m-0 list-none p-0">
          {tags.data?.tags.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 py-2 not-first:border-t not-first:border-border"
            >
              <div className="min-w-0 flex-1">
                <div className={chipsClass}>
                  <TagChip tag={t} />
                </div>
                {t.description && <p className={help}>{t.description}</p>}
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
