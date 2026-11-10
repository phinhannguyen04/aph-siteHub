'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Login } from '@/components/auth/login'
import { Busy, ErrorBox } from '@/components/common'
import { onUnauthorized, request, setToken } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'

const NoticeContext = createContext<(message: string, severity?: 'success' | 'error') => void>(
  () => {},
)
export const useNotice = () => useContext(NoticeContext)
const SessionContext = createContext({ logout: async () => {} })
export const useSession = () => useContext(SessionContext)
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
  const toast = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = toast.current
    if (!el?.showPopover) return
    // Re-showing moves the popover to the top of the top layer, above any open modal dialog.
    if (el.matches(':popover-open')) el.hidePopover()
    if (!notice) return
    el.showPopover()
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])
  const notify = useCallback(
    (message: string, severity: 'success' | 'error' = 'success') =>
      setNotice({ message, severity }),
    [],
  )
  const [session, setSession] = useState<'loading' | 'guest' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<ApiError | null>(null)
  const [expired, setExpired] = useState(false)
  const bootstrapped = useRef(false)
  const bootstrap = useCallback(async () => {
    setSession('loading')
    const r = await request<{ csrfToken: string }>('/api/auth/session')
    if (r.ok) {
      setToken(r.data.csrfToken)
      setSession('ready')
    } else if (r.error.status === 401) {
      setSession('guest')
    } else {
      setError(r.error)
      setSession('error')
    }
  }, [])
  useEffect(
    () =>
      onUnauthorized(() => {
        client.clear()
        setExpired(true)
        setSession('guest')
      }),
    [client],
  )
  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true
      void bootstrap()
    }
  }, [bootstrap])
  const logout = async () => {
    const r = await request('/api/auth/logout', 'POST')
    if (!r.ok) {
      notify(r.error.message, 'error')
      return
    }
    setToken('')
    client.clear()
    setExpired(false)
    setSession('guest')
  }
  return (
    <QueryClientProvider client={client}>
      <NoticeContext.Provider value={notify}>
        <SessionContext.Provider value={{ logout }}>
          {session === 'loading' ? (
            <Busy />
          ) : session === 'error' ? (
            <div className="mx-auto max-w-xl p-6">
              <ErrorBox error={error} retry={bootstrap} />
            </div>
          ) : session === 'guest' ? (
            <Login
              expired={expired}
              onSuccess={() => {
                setExpired(false)
                setSession('ready')
              }}
            />
          ) : (
            children
          )}
          <div
            ref={toast}
            popover="manual"
            className="fixed inset-auto end-4 bottom-4 m-0 max-w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0"
          >
            {notice && (
              <div
                role={notice.severity === 'error' ? 'alert' : 'status'}
                className={`alert shadow-lg ${notice.severity === 'error' ? 'alert-error' : 'alert-success'}`}
              >
                {notice.severity === 'error' ? (
                  <CircleAlert size={18} aria-hidden />
                ) : (
                  <CircleCheck size={18} aria-hidden />
                )}
                <span>{notice.message}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square"
                  aria-label={c.dismiss}
                  onClick={() => setNotice(null)}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </SessionContext.Provider>
      </NoticeContext.Provider>
    </QueryClientProvider>
  )
}
