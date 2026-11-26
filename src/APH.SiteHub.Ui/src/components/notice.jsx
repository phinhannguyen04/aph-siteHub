import { useCallback } from 'react'
import { toast } from 'sonner'

/** Returns `notify(message, severity = 'success' | 'error')`, backed by sonner. */
export function useNotice() {
  return useCallback((message, severity = 'success') => {
    if (severity === 'error') toast.error(message, { duration: 8000 })
    else toast.success(message)
  }, [])
}
