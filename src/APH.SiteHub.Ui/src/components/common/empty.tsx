'use client'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
export function Empty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Inbox size={22} aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {body && <p className="mt-1 max-w-sm text-base-content/70">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
