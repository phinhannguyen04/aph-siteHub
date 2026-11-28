export function Empty({ title, body, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-input px-4 py-6 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-[40ch] text-subtle">{body}</p>
      {action}
    </div>
  )
}
