import { BrowserRouter, Route, Routes } from 'react-router'
import { Shell } from '@/components/layout/shell'
import { Accounts } from '@/pages/accounts'
import { NotFound } from '@/pages/not-found'
import { Websites } from '@/pages/websites'
import { Providers } from './providers'

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Websites />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Providers>
    </BrowserRouter>
  )
}
