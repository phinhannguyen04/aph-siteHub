import { Suspense } from 'react'
import { Busy } from '@/components/common'
import { Shell } from '@/components/layout/shell'
import { Websites } from '@/components/websites/websites'
export default function Page() {
  return (
    <Shell>
      <Suspense fallback={<Busy />}>
        <Websites />
      </Suspense>
    </Shell>
  )
}
