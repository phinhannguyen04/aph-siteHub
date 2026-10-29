'use client'
import { Alert, CssBaseline, Snackbar, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { theme } from '@/theme/theme'

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
    <ThemeProvider
      theme={theme}
      defaultMode="system"
      modeStorageKey="sitehub-theme"
      colorSchemeStorageKey="sitehub-theme"
    >
      <CssBaseline />
      <QueryClientProvider client={client}>
        <NoticeContext.Provider value={notify}>
          <SessionContext.Provider value={{ logout }}>
            {session === 'loading' ? (
              <Busy />
            ) : session === 'error' ? (
              <ErrorBox error={error} retry={bootstrap} />
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
            <Snackbar open={!!notice} autoHideDuration={5000} onClose={() => setNotice(null)}>
              <Alert severity={notice?.severity} onClose={() => setNotice(null)}>
                {notice?.message}
              </Alert>
            </Snackbar>
          </SessionContext.Provider>
        </NoticeContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
