import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { Accounts } from '@/components/accounts/accounts'
import { buttonClass, Empty } from '@/components/common'
import { Providers } from '@/components/layout/providers'
import { Shell } from '@/components/layout/shell'
import { Websites } from '@/components/websites/websites'
import { c } from '@/lib/copy'

function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <Empty
        title={c.notFound}
        body={c.notFoundBody}
        action={
          <Link className={buttonClass({ variant: 'primary' })} to="/">
            {c.home}
          </Link>
        }
      />
    </div>
  )
}

const rootRoute = createRootRoute({
  component: () => (
    <Providers>
      <Outlet />
    </Providers>
  ),
  notFoundComponent: NotFound,
})

// Pathless layout route: every page below is rendered inside the sidebar shell.
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
})

const websitesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  // Filters are sanitised by websiteFilters, so the raw string values pass through untouched.
  validateSearch: (search: Record<string, unknown>) => search as Record<string, string>,
  component: Websites,
})

const accountsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/accounts',
  component: Accounts,
})

const routeTree = rootRoute.addChildren([shellRoute.addChildren([websitesRoute, accountsRoute])])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Keep query values as plain strings (the default parser would turn `search=123` into a number
  // and `tagIds` into something other than the comma-separated list the API expects).
  parseSearch: (search) => Object.fromEntries(new URLSearchParams(search)),
  stringifySearch: (search) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) params.set(key, String(value))
    }
    const text = params.toString()
    return text ? `?${text}` : ''
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
