import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNotice } from '@/components/notice'
import { query, request } from './api'
import { c } from './copy'

export const useTags = () => useQuery({ queryKey: ['tags'], queryFn: () => query('/api/tags') })

/**
 * Serialises writes (a second call while one is pending is ignored), refreshes the listed query
 * keys on success and surfaces the API error on failure.
 */
export function useWrite(keys) {
  const client = useQueryClient()
  const notify = useNotice()
  const guard = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const refresh = () =>
    Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [key] })))

  async function apply(action, method, success) {
    if (guard.current) return
    guard.current = true
    setPending(true)
    setError(null)
    try {
      const result = await action()
      if (result.ok) {
        await refresh()
        notify(method === 'DELETE' ? c.deleted : method === 'POST' ? c.created : c.saved)
        success(result.data)
      } else {
        setError(result.error)
        if (result.error.status === 404) {
          notify(c.missing, 'error')
          await refresh()
        }
      }
    } finally {
      guard.current = false
      setPending(false)
    }
  }
  return {
    run: (path, method, body, success) => apply(() => request(path, method, body), method, success),
    runDelete: (action, success) => apply(action, 'DELETE', success),
    pending,
    error,
  }
}
