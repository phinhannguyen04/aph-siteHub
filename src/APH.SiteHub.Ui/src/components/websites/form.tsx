'use client'
import { ArrowDownward, ArrowUpward } from '@mui/icons-material'
import {
  Autocomplete,
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
      <Dialog
        open
        onClose={write.pending ? undefined : onClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="website-title"
      >
        <Box
          component="form"
          noValidate
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
        >
          <DialogTitle id="website-title">{website ? c.editWebsite : c.addWebsite}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <ErrorBox error={write.error} />
              <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
              <TextField
                autoFocus
                required
                label={c.name}
                error={!!validation.name}
                helperText={validation.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                required
                label={c.url}
                error={!!validation.url}
                helperText={validation.url}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
              />
              <Autocomplete
                multiple
                options={tags.data?.tags ?? []}
                value={selected}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                getOptionLabel={(t) => t.name}
                onChange={(_, v) => setSelected(v)}
                renderInput={(p) => (
                  <TextField
                    {...p}
                    label={c.tagPicker}
                    error={!!validation.tag_ids}
                    helperText={validation.tag_ids}
                  />
                )}
                renderValue={(values) => (
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {values.map((t) => (
                      <TagChip
                        key={t.id}
                        tag={t}
                        onDelete={() => setSelected(selected.filter((v) => v.id !== t.id))}
                      />
                    ))}
                  </Stack>
                )}
              />
              <Stack spacing={0.5}>
                {selected.map((t, i) => (
                  <Stack key={t.id} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <TagChip tag={t} />
                    </Box>
                    <IconButton
                      aria-label={`${c.up}: ${t.name}`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={`${c.down}: ${t.name}`}
                      disabled={i === selected.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button onClick={() => setQuick(true)} sx={{ alignSelf: 'flex-start' }}>
                {c.quickTag}
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={write.pending}>
              {c.cancel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              loading={write.pending}
              disabled={website && Object.keys(patch).length === 0}
            >
              {website ? c.save : c.create}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {quick && (
        <TagForm
          onClose={() => setQuick(false)}
          onCreated={(tag) => setSelected((old) => (old.length < 50 ? [...old, tag] : old))}
        />
      )}
    </>
  )
}
