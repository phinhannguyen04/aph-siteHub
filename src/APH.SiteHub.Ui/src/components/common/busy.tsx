'use client'
import { c } from '@/lib/copy'
export function Busy() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-base-content/70">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
      <p>{c.loading}</p>
    </div>
  )
}
