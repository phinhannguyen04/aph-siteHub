'use client'
import { ContentCopy } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import { useNotice } from '@/components/layout/providers'
import { c } from '@/lib/copy'
export function Copy({ value, label = c.copy }: { value: string; label?: string }) {
  const notice = useNotice()
  return (
    <IconButton
      size="small"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          notice(c.copied)
        } catch {
          notice(c.copyFailed, 'error')
        }
      }}
    >
      <ContentCopy fontSize="small" />
    </IconButton>
  )
}
