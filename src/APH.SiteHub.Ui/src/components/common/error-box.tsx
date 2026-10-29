'use client'
import { Alert, Button } from '@mui/material'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null
  const e = error as ApiError
  return (
    <Alert
      severity="error"
      action={
        retry && (
          <Button color="inherit" onClick={retry}>
            {c.retry}
          </Button>
        )
      }
    >
      {e.status === 403
        ? c.forbidden
        : e.status === 404
          ? c.missing
          : e.status === 503
            ? c.database
            : (e.message ?? String(error))}
    </Alert>
  )
}
