'use client'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { ErrorBox, TagChip } from '@/components/common'
import { useWrite } from '@/lib/api/hooks'
import type { Tag } from '@/lib/api/types'
import { c } from '@/lib/copy'
import type { TagErrors } from '@/lib/validation'
import { tagName, tag as validate } from '@/lib/validation'

const palette = ['#344e63', '#275f4c', '#825a20', '#8a3d51', '#62518b', '#226b80']
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
    <Dialog
      open
      onClose={write.pending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="tag-title"
    >
      <Box
        component="form"
        noValidate
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
      >
        <DialogTitle id="tag-title">{tag ? c.editTag : c.newTag}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <ErrorBox error={write.error} />
            <TextField
              autoFocus
              label={c.name}
              error={!!validation.name}
              helperText={validation.name}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label={c.description}
              error={!!validation.description}
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText={validation.description ?? `${description.length}/240`}
            />
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {palette.map((value) => (
                <IconButton
                  key={value}
                  aria-label={`${c.color} ${value}`}
                  onClick={() => setColor(value)}
                  sx={{
                    bgcolor: value,
                    width: 30,
                    height: 30,
                    border: color === value ? '3px solid currentColor' : undefined,
                    '&:hover': { bgcolor: value },
                  }}
                />
              ))}
            </Stack>
            <TextField
              label={c.color}
              error={!!validation.color}
              helperText={validation.color}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            {/^#[\da-f]{6}$/i.test(color) && (
              <TagChip tag={{ name: tagName(name) || c.newTag, color } as Tag} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={write.pending} onClick={onClose}>
            {c.cancel}
          </Button>
          <Button type="submit" variant="contained" loading={write.pending}>
            {tag ? c.save : c.create}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
