'use client'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material'
import type { ReactNode } from 'react'
import { c } from '@/lib/copy'
export function Confirm({
  title,
  children,
  pending,
  onClose,
  onConfirm,
  disabled = false,
}: {
  title: string
  children: ReactNode
  pending: boolean
  onClose: () => void
  onConfirm: () => void
  disabled?: boolean
}) {
  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="confirm-title"
    >
      <DialogTitle id="confirm-title">{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={pending} onClick={onClose}>
          {c.cancel}
        </Button>
        <Button
          color="error"
          variant="contained"
          loading={pending}
          disabled={disabled}
          onClick={onConfirm}
        >
          {c.delete}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
