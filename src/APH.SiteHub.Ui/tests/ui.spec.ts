import { expect, type Page, test } from '@playwright/test'

const browserErrors = new WeakMap<Page, string[]>()
test.beforeEach(({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().startsWith('Warning:'))
      errors.push(message.text())
  })
})
test.afterEach(({ page }) => {
  expect(browserErrors.get(page)).toEqual([])
})
const id = 'a26cb4ea-3d1e-4e85-a438-e306b0421cc1'
const tag = {
  id,
  name: 'Work',
  description: 'Daily destinations',
  color: '#275f4c',
  created_at: '2026-10-29T00:00:00Z',
  updated_at: '2026-10-29T00:00:00Z',
}
const site = {
  id,
  name: 'Documentation',
  url: 'https://example.com/',
  tag_ids: [id],
  tags: [tag],
  created_at: tag.created_at,
  updated_at: tag.updated_at,
}
const account = {
  id,
  provider: 'Example',
  login_name: 'admin@example.com',
  email: 'admin@example.com',
  external_account_id: 'external-123',
  is_limit: false,
  created_at: tag.created_at,
}
async function mock(page: Page) {
  const state = {
    secretRequests: 0,
    mutations: [] as {
      path: string
      method: string
      body: Record<string, unknown> | null
    }[],
    queries: [] as string[],
    sites: [site],
    accounts: [account],
    tags: [tag],
    conflict: false,
    database: false,
    countRequests: 0,
  }
  await page.route('https://example.com/**', (route) => route.abort())
  await page.route('**/api/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    const method = req.method()
    const body = req.postDataJSON() as Record<string, unknown> | null
    const respond = (data: unknown, status = 200) => route.fulfill({ status, json: data })
    const fail = (status: number, code: string, message: string) =>
      respond({ error: { code, message } }, status)
    if (method !== 'GET') state.mutations.push({ path, method, body })
    if (state.database) return fail(503, 'DATABASE_UNAVAILABLE', 'Unavailable')
    if (path === '/api/websites/count') {
      state.countRequests++
      return respond({ count: state.sites.length })
    }
    if (path === '/api/websites') {
      if (method === 'POST') {
        state.sites = [{ ...site, ...body }]
        return respond({ website: state.sites[0] }, 201)
      }
      const p = new URL(req.url()).searchParams
      state.queries.push(p.toString())
      const filtered = state.sites.filter(
        (s) =>
          !p.get('search') || s.name.toLowerCase().includes(p.get('search')?.toLowerCase() ?? ''),
      )
      const page = Number(p.get('page') ?? 1)
      const pageSize = Number(p.get('pageSize') ?? 12)
      const start = (page - 1) * pageSize
      return respond({
        websites: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      })
    }
    if (path.startsWith('/api/websites/')) {
      if (method === 'DELETE') {
        const deleted = path.slice(path.lastIndexOf('/') + 1)
        state.sites = state.sites.filter((s) => s.id !== deleted)
        return respond({ ok: true })
      }
      state.sites = [{ ...state.sites[0], ...body }]
      return respond({ website: state.sites[0] })
    }
    if (path === '/api/tags' && method === 'GET') return respond({ tags: state.tags })
    if (path.startsWith('/api/tags')) {
      if (state.conflict) return fail(409, 'CONFLICT', 'Tag name already exists')
      if (method === 'DELETE') {
        state.tags = []
        return respond({ ok: true })
      }
      const saved = { ...tag, ...body }
      state.tags = [saved]
      return respond({ tag: saved })
    }
    if (path === '/api/accounts/stats')
      return respond({
        stats: {
          total: state.accounts.length,
          limited: 0,
          unlimited: state.accounts.length,
          providers: [
            {
              provider: 'Example',
              total: state.accounts.length,
              limited: 0,
              unlimited: state.accounts.length,
            },
          ],
        },
      })
    if (path === '/api/accounts' && method === 'GET') return respond({ accounts: state.accounts })
    if (path.endsWith('/secret-key')) {
      state.secretRequests++
      return respond({ secret_key: 'sensitive-test-value' })
    }
    if (path.startsWith('/api/accounts')) {
      if (method === 'DELETE') {
        state.accounts = []
        return respond({ ok: true })
      }
      if (method === 'PATCH') state.accounts = [{ ...account, ...body }]
      if (method === 'POST') state.accounts = [{ ...account, ...body }]
      return respond({ account: state.accounts[0] })
    }
    return fail(404, 'NOT_FOUND', 'Missing')
  })
  return state
}
test('opens directly on the requested route with no sign-in step and theme-only storage', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  await mock(page)
  await page.goto('/accounts')
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible()
  expect(page.url()).toContain('/accounts')
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Change password', exact: true })).toHaveCount(0)
  expect(requests.filter((path) => path.startsWith('/api/auth'))).toEqual([])
  await page.goto('/login')
  await expect(page.getByText('Page not found', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).every((k) => k.startsWith('sitehub-theme')),
    ),
  ).toBe(true)
})
test('website URL filters, minimal PATCH and tag creation/conflict/deletion', async ({ page }) => {
  const state = await mock(page)
  await page.goto('/?page=1&pageSize=24')
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible()
  expect(await page.getByRole('button', { name: /Delete Documentation/ }).count()).toBe(1)
  await page.getByLabel(/^Search websites/).fill('missing')
  await expect(page).toHaveURL(/search=missing/)
  await expect(page.getByText('No matching results')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByRole('button', { name: 'Edit Documentation', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await page.getByLabel(/^Name/).fill('Handbook')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Handbook', exact: true })).toBeVisible()
  expect(state.mutations.at(-1)?.body).toEqual({ name: 'Handbook' })
  await page.getByRole('button', { name: 'Manage tags', exact: true }).click()
  await page.getByRole('button', { name: 'New tag', exact: true }).click()
  await page.getByLabel(/^Name/).fill('New')
  state.conflict = true
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(page.getByText('Tag name already exists')).toBeVisible()
  state.conflict = false
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.getByRole('button', { name: 'Delete New', exact: true }).click()
  await expect(
    page.getByText('This tag will be removed from every website that uses it.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('No tags yet. Create one to organize your websites.')).toBeVisible()
})
test('website deletion confirms the name, refreshes the count and leaves an emptied page', async ({
  page,
}) => {
  const state = await mock(page)
  state.sites = Array.from({ length: 13 }, (_, index) => ({
    ...site,
    id: `a26cb4ea-3d1e-4e85-a438-e306b0421c${String(index).padStart(2, '0')}`,
    name: `Website ${index + 1}`,
    url: `https://example.com/${index + 1}`,
  }))
  await page.goto('/?page=2&pageSize=12')
  await expect(page.getByRole('heading', { name: 'Website 13', exact: true })).toBeVisible()
  const badge = page.getByTestId('website-count')
  await expect(badge).toHaveText('13')
  const countRequests = state.countRequests
  await page.getByRole('button', { name: 'Delete Website 13', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete website?', exact: true })
  await expect(dialog.getByText('Website 13', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Website 13', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Website 13', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Delete website?', exact: true })
    .getByRole('button', { name: 'Delete', exact: true })
    .click()
  await expect(page).toHaveURL(/page=1/)
  await expect(page.getByRole('heading', { name: 'Website 12', exact: true })).toBeVisible()
  await expect(badge).toHaveText('12')
  expect(state.sites).toHaveLength(12)
  expect(state.countRequests).toBeGreaterThan(countRequests)
  expect(state.mutations.at(-1)).toMatchObject({
    path: '/api/websites/a26cb4ea-3d1e-4e85-a438-e306b0421c12',
    method: 'DELETE',
  })
})
test('account list/table, secret timeout, minimal edit and typed delete', async ({ page }) => {
  const state = await mock(page)
  await page.goto('/accounts')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await page.getByRole('button', { name: 'Login name', exact: true }).click()
  await page.getByRole('button', { name: account.login_name, exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Account details', exact: true })).toBeVisible()
  expect(state.secretRequests).toBe(0)
  await page.clock.install()
  await page.getByRole('button', { name: 'Reveal', exact: true }).click()
  await expect(page.getByText('sensitive-test-value', { exact: true })).toBeVisible()
  expect(state.secretRequests).toBe(1)
  await page.clock.fastForward(31000)
  await expect(page.getByText('sensitive-test-value', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Set new password', exact: true }).click()
  await page.getByLabel(/^Set new password/).fill('changed account password')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect(state.mutations.at(-1)?.body).toEqual({ password: 'changed account password' })
  await page.getByRole('button', { name: `Delete ${account.login_name}`, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeDisabled()
  await page.getByLabel('Type the login name to confirm').fill(account.login_name)
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('No accounts yet', { exact: true })).toBeVisible()
})
test('desktop and 360px mobile layouts, navigation, dark theme and error recovery', async ({
  page,
}) => {
  const state = await mock(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/websites-desktop.png', fullPage: true })
  await page.goto('/accounts')
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/accounts-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 360, height: 800 })
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/accounts-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
  await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 25, 30)')
  await page
    .getByRole('link', { name: /Websites/ })
    .last()
    .click()
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/websites-mobile-dark.png', fullPage: true })
  state.database = true
  await page.reload()
  await expect(page.getByText('Database unavailable. Please try again.').first()).toBeVisible()
  state.database = false
  await page.getByRole('button', { name: 'Try again', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible()
})

test('field validation identifies invalid inputs and blocks requests without replacing server errors', async ({
  page,
}) => {
  const state = await mock(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Add website', exact: true }).click()
  const website = page.getByRole('dialog', { name: 'Add website', exact: true })
  await website.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(website.getByLabel(/^Name/)).toHaveAccessibleDescription('Enter a website name.')
  await expect(website.getByLabel(/^Website URL/)).toHaveAccessibleDescription(
    'Enter a website URL.',
  )
  await website.getByLabel(/^Name/).fill('Valid website')
  await website.getByLabel(/^Website URL/).fill('https://user:password@example.com')
  await website.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(website.getByLabel(/^Name/)).toHaveAttribute('aria-invalid', 'false')
  await expect(website.getByLabel(/^Website URL/)).toHaveAccessibleDescription(
    'URL must not contain a username or password.',
  )
  await website.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Manage tags', exact: true }).click()
  await page.getByRole('button', { name: 'New tag', exact: true }).click()
  const tagForm = page.getByRole('dialog', { name: 'New tag', exact: true })
  await tagForm.getByLabel(/^Description/).fill('x'.repeat(241))
  await tagForm.getByRole('textbox', { name: 'Color', exact: true }).fill('red')
  await tagForm.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(tagForm.getByLabel(/^Name/)).toHaveAttribute('aria-invalid', 'true')
  await expect(tagForm.getByLabel(/^Description/)).toHaveAccessibleDescription(
    'Description must be at most 240 characters.',
  )
  await expect(
    tagForm.getByRole('textbox', { name: 'Color', exact: true }),
  ).toHaveAccessibleDescription('Use a six-digit hex color, such as #344e63.')
  await tagForm.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('link', { name: 'Accounts', exact: true }).click()
  await page.getByRole('button', { name: 'Add account', exact: true }).click()
  const accountForm = page.getByRole('dialog', { name: 'Add account', exact: true })
  await accountForm.getByLabel(/^Email/).fill('invalid-email')
  await accountForm.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(accountForm.getByLabel(/^Provider/)).toHaveAccessibleDescription(
    'Provider is required.',
  )
  await expect(accountForm.getByLabel(/^Email/)).toHaveAccessibleDescription(
    'Enter a valid email address containing a dot.',
  )
  await expect(accountForm.getByLabel(/^Password/)).toHaveAccessibleDescription(
    'Password is required.',
  )
  await expect(accountForm.getByLabel(/^Secret key/)).toHaveAccessibleDescription(
    'Secret key is required.',
  )
  await accountForm.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(state.mutations).toHaveLength(0)
})

test('website cards never request resources from managed website origins', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:18111')
      externalRequests.push(request.url())
  })
  await mock(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible()
  await expect(page.locator('main img')).toHaveCount(0)
  expect(externalRequests).toEqual([])
})
