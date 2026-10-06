import { createRootRoute, createRoute, createRouter } from '@tanstack/vue-router'
import App from './App.vue'
import WebsitesPage from './pages/WebsitesPage.vue'
import AccountsPage from './pages/AccountsPage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import { parseWebsiteSearch } from './website-search'

const rootRoute = createRootRoute({ component: App, notFoundComponent: NotFoundPage })
const websitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: parseWebsiteSearch,
  component: WebsitesPage,
})
const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounts',
  component: AccountsPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([websitesRoute, accountsRoute]),
  scrollRestoration: true,
})

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
