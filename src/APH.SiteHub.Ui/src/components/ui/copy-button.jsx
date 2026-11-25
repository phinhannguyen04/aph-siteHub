import { Copy } from 'lucide-react'
import { c } from '@/lib/copy'
import { useNotice } from '../notice'
import { Button } from './button'

/** Copies text to the clipboard and reports the outcome in a toast. */
export function CopyButton({ value, label }) {
  const notify = useNotice()
  return (
    <Button
      variant="ghost"
      size="sm"
      icon
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          notify(c.copied)
        } catch {
          notify(c.copyFailed, 'error')
        }
      }}
    >
      <Copy size={14} />
    </Button>
  )
}
