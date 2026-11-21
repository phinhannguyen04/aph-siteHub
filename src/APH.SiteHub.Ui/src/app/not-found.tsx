'use client'
import Link from 'next/link'
import { buttonClass, Empty } from '@/components/common'
import { c } from '@/lib/copy'
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <Empty
        title={c.notFound}
        body={c.notFoundBody}
        action={
          <Link className={buttonClass({ variant: 'primary' })} href="/">
            {c.home}
          </Link>
        }
      />
    </div>
  )
}
