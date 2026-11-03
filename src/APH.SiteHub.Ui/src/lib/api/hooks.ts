'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNotice } from '@/components/layout/providers'
import { c } from '../copy'
import { query, request } from './client'
import type { ApiError, Result, Tag } from './types'
export const useTags = () =>
  useQuery({ queryKey: ['tags'], queryFn: () => query<{ tags: Tag[] }>('/api/tags') })
export function useWrite(keys: string[]) {
  const client = useQueryClient()
  const notify = useNotice()
  const guard = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  async function apply<T>(
    action: () => Promise<Result<T>>,
    method: string,
    success: (data: T) => void,
  ) {
    if (guard.current) return
    guard.current = true
    setPending(true)
    setError(null)
    try {
      const result = await action()
      if (result.ok) {
        await Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [key] })))
        notify(method === 'DELETE' ? c.deleted : method === 'POST' ? c.created : c.saved)
        success(result.data)
      } else {
        setError(result.error)
        if (result.error.status === 404) {
          notify(c.missing, 'error')
          await Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [key] })))
        }
      }
    } finally {
      guard.current = false
      setPending(false)
    }
  }
  function run<T>(
    path: string,
    method: string,
    body: object | undefined,
    success: (data: T) => void,
  ) {
    return apply(() => request<T>(path, method, body), method, success)
  }
  function runDelete<T>(action: () => Promise<Result<T>>, success: (data: T) => void) {
    return apply(action, 'DELETE', success)
  }
  return { run, runDelete, pending, error, setError }
}
