import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { Providers } from '@/components/notice'
import { Shell } from '@/components/shell'
import { buttonLink, Empty } from '@/components/ui'
import { c } from '@/lib/copy'
import { Accounts } from '@/pages/accounts'
import { Websites } from '@/pages/websites'
import '@fontsource-variable/inter'
import './styles.css'

function NotFound() {
  return (
    <Empty
      title={c.notFound}
      body={c.notFoundBody}
      action={
        <Link className={buttonLink} to="/">
          {c.home}
        </Link>
      }
    />
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')
createRoot(root).render(
  <StrictMode>
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
  </StrictMode>,
)
