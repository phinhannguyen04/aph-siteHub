import { c } from '@/lib/copy'

export function Spinner() {
  return <span className="spinner" role="status" aria-label={c.loading} />
}
