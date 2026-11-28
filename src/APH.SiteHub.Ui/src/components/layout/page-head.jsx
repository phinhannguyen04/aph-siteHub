export function PageHead({ title, intro, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl leading-[1.3] font-semibold text-ink">{title}</h1>
        <p className="mt-0.5 text-subtle">{intro}</p>
      </div>
      {children && <div>{children}</div>}
    </div>
  )
}
