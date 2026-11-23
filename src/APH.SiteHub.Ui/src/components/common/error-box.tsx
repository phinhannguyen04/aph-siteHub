import { CircleAlert } from 'lucide-react'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { Alert } from './alert'
import { Button } from './button'
export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null
  const e = error as ApiError
  return (
    <Alert tone="error" role="alert">
      <CircleAlert size={18} aria-hidden />
      <span className="min-w-0 flex-1">
        {e.status === 404
          ? c.missing
          : e.status === 503
            ? c.database
            : (e.message ?? String(error))}
      </span>
      {retry && (
        <Button size="sm" variant="ghost" className="ms-auto" onClick={retry}>
          {c.retry}
        </Button>
      )}
    </Alert>
  )
}
