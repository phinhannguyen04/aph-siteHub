import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { c } from '@/lib/copy'
import { Button, cx } from './ui'

const NoticeContext = createContext(() => {})
export const useNotice = () => useContext(NoticeContext)

function Toast({ notice, onDismiss }) {
  const ref = useRef(null)
  useEffect(() => {
    const element = ref.current
    element?.showPopover()
    return () => {
      if (element?.matches(':popover-open')) element.hidePopover()
    }
  }, [])
  return (
    <div
      ref={ref}
      popover="manual"
      className={cx('toast', notice.severity === 'error' && 'error')}
      role={notice.severity === 'error' ? 'alert' : 'status'}
    >
      {notice.severity === 'error' ? (
        <CircleAlert size={18} aria-hidden />
      ) : (
        <CircleCheck size={18} aria-hidden />
      )}
      <span>{notice.message}</span>
      <Button variant="ghost" size="sm" icon aria-label={c.dismiss} onClick={onDismiss}>
        <X size={14} />
      </Button>
    </div>
  )
}

export function Providers({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  )
  const [notice, setNotice] = useState(null)
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])
  const notify = useCallback(
    (message, severity = 'success') => setNotice({ message, severity, id: Date.now() }),
    [],
  )
  return (
    <QueryClientProvider client={client}>
      <NoticeContext.Provider value={notify}>
        {children}
        {notice && <Toast key={notice.id} notice={notice} onDismiss={() => setNotice(null)} />}
      </NoticeContext.Provider>
    </QueryClientProvider>
  )
}
