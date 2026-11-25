import { CircleAlert } from 'lucide-react'
import { c } from '@/lib/copy'
import { Button } from './button'

export function ErrorBox({ error, retry }) {
  if (!error) return null
  return (
    <div className="alert" role="alert">
      <CircleAlert size={16} aria-hidden />
      <span>{error.message}</span>
      {retry && (
        <Button variant="ghost" size="sm" onClick={retry}>
          {c.retry}
        </Button>
      )}
    </div>
  )
}
