'use client'
import { CircleAlert } from 'lucide-react'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null
  const e = error as ApiError
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <CircleAlert size={18} aria-hidden />
      <span>
        {e.status === 403
          ? c.forbidden
          : e.status === 404
            ? c.missing
            : e.status === 503
              ? c.database
              : (e.message ?? String(error))}
      </span>
      {retry && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={retry}>
          {c.retry}
        </button>
      )}
    </div>
  )
}
