'use client'
import { Copy as CopyIcon } from 'lucide-react'
import { useNotice } from '@/components/layout/providers'
import { c } from '@/lib/copy'
export function Copy({ value, label = c.copy }: { value: string; label?: string }) {
  const notice = useNotice()
  return (
    <div className="tooltip tooltip-left" data-tip={c.copy}>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
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
      </button>
    </div>
  )
}
