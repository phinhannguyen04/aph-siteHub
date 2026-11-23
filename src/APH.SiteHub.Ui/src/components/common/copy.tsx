import { Copy as CopyIcon } from 'lucide-react'
import { useNotice } from '@/components/layout/providers'
import { c } from '@/lib/copy'
import { Button } from './button'
export function Copy({ value, label = c.copy }: { value: string; label?: string }) {
  const notice = useNotice()
  return (
    <Button
      variant="ghost"
      size="xs"
      square
      title={c.copy}
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
      <CopyIcon size={14} />
    </Button>
  )
}
