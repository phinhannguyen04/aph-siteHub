import { Link } from 'react-router'
import { buttonLink, Empty } from '@/components/ui'
import { c } from '@/lib/copy'

export function NotFound() {
  return (
    <Empty
      title={c.notFound}
      body={c.notFoundBody}
      action={
        <Link className={buttonLink} to="/">
          {c.home}
        </Link>
      }
    />
  )
}
