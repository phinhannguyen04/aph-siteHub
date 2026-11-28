import { Spinner } from './spinner'

export function Busy() {
  return (
    <div className="grid place-items-center p-6 text-subtle">
      <Spinner />
    </div>
  )
}
