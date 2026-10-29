'use client'
import { Button } from '@mui/material'
import { Empty } from '@/components/common'
import { c } from '@/lib/copy'
export default function NotFound() {
  return (
    <Empty title={c.notFound} body={c.notFoundBody} action={<Button href="/">{c.home}</Button>} />
  )
}
