export function PageHead({ title, intro, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}
