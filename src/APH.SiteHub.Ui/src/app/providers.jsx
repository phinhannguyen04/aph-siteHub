import { Toast } from '@base-ui/react/toast'
import { Tooltip } from '@base-ui/react/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ToastList } from '@/components/notice'

export function Providers({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      <Tooltip.Provider delay={300}>
        <Toast.Provider limit={3}>
          {children}
          <ToastList />
        </Toast.Provider>
      </Tooltip.Provider>
    </QueryClientProvider>
  )
}
