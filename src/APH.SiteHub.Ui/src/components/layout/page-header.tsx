import type { ReactNode } from 'react'

export function PageHeader({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-base-content/70">{intro}</p>
      </div>
      {children}
    </div>
  )
}
