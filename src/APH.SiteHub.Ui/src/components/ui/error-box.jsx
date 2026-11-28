import { CircleAlert } from 'lucide-react'
import { c } from '@/lib/copy'
import { Button } from './app-button'

export function ErrorBox({ error, retry }) {
  if (!error) return null
  return (
    <div
      className="flex items-center gap-2 rounded-md bg-[var(--danger-soft)] px-3 py-2 font-semibold text-destructive"
      role="alert"
    >
      <CircleAlert size={16} aria-hidden />
      <span>{error.message}</span>
      {retry && (
        <Button variant="ghost" size="sm" className="ml-auto text-inherit" onClick={retry}>
          {c.retry}
        </Button>
      )}
    </div>
  )
}
