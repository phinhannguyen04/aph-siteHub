import { c } from '@/lib/copy'
import { Spinner } from './spinner'
export function Busy() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-base-content/70">
      <Spinner className="size-8 border-[3px] text-primary" />
      <p>{c.loading}</p>
    </div>
  )
}
