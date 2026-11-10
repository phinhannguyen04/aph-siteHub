'use client'
import Link from 'next/link'
import { Empty } from '@/components/common'
import { c } from '@/lib/copy'
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <Empty
        title={c.notFound}
        body={c.notFoundBody}
        action={
          <Link className="btn btn-primary" href="/">
            {c.home}
          </Link>
        }
      />
    </div>
  )
}
