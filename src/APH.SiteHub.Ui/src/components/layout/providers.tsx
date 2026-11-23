import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { Alert, Button } from '@/components/common'
import { c } from '@/lib/copy'

const NoticeContext = createContext<(message: string, severity?: 'success' | 'error') => void>(
  () => {},
)
export const useNotice = () => useContext(NoticeContext)
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  )
  const [notice, setNotice] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null,
  )
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])
  const notify = useCallback(
    (message: string, severity: 'success' | 'error' = 'success') =>
      setNotice({ message, severity }),
    [],
  )
  return (
    <QueryClientProvider client={client}>
      <NoticeContext.Provider value={notify}>
        {children}
        {/* Mounted only while a notice exists: Headless UI dialogs mark pre-existing siblings
              inert, so a toast created after a dialog opened stays readable and dismissable. */}
        {notice && (
          <div className="fixed end-4 bottom-4 z-[100] max-w-[calc(100vw-2rem)]">
            <Alert
              solid
              tone={notice.severity}
              role={notice.severity === 'error' ? 'alert' : 'status'}
              className="shadow-lg"
            >
              {notice.severity === 'error' ? (
                <CircleAlert size={18} aria-hidden />
              ) : (
                <CircleCheck size={18} aria-hidden />
              )}
              <span>{notice.message}</span>
              <Button
                variant="ghost"
                size="xs"
                square
                aria-label={c.dismiss}
                onClick={() => setNotice(null)}
              >
                <X size={14} />
              </Button>
            </Alert>
          </div>
        )}
      </NoticeContext.Provider>
    </QueryClientProvider>
  )
}
