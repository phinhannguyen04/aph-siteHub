'use client'
import { Add, DeleteOutlined, EditOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Busy, Confirm, Empty, ErrorBox, TagChip } from '@/components/common'
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
      <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="tags-title">
        <DialogTitle id="tags-title">{c.tags}</DialogTitle>
        <DialogContent>
          <Button startIcon={<Add />} onClick={() => setForm('new')} sx={{ mb: 2 }}>
            {c.newTag}
          </Button>
          <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
          {tags.isPending ? (
            <Busy />
          ) : tags.data?.tags.length === 0 ? (
            <Empty title={c.noTags} body="" />
          ) : (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {tags.data?.tags.map((tag) => (
                <Stack direction="row" key={tag.id} sx={{ alignItems: 'center', gap: 1, py: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TagChip tag={tag} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {tag.description}
                    </Typography>
                  </Box>
                  <IconButton aria-label={`${c.edit} ${tag.name}`} onClick={() => setForm(tag)}>
                    <EditOutlined />
                  </IconButton>
                  <IconButton
                    aria-label={`${c.delete} ${tag.name}`}
                    onClick={() => setDeleting(tag)}
                  >
                    <DeleteOutlined />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{c.close}</Button>
        </DialogActions>
      </Dialog>
      {form && <TagForm tag={form === 'new' ? undefined : form} onClose={() => setForm(null)} />}{' '}
      {deleting && (
        <Confirm
          title={c.deleteTag}
          pending={write.pending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            void write.run(`/api/tags/${deleting.id}`, 'DELETE', undefined, () => setDeleting(null))
          }
        >
          <TagChip tag={deleting} />
          <Typography>{c.tagWarning}</Typography>
          <ErrorBox error={write.error} />
        </Confirm>
      )}
    </>
  )
}
