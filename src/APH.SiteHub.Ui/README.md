# APH SiteHub UI

Standalone Next.js App Router + TypeScript + MUI dashboard. Requires Bun and Node.js 20.9+.

```sh
cd src/APH.SiteHub.Ui
bun install
bun run dev
```

Open `http://localhost:8111`. Start the existing ASP.NET Core backend separately using the repository README. Its `APP_ORIGIN` must exactly match the browser origin, including the port. Port 8111 must be available; this UI does not replace the existing Compose frontend or change deployment configuration.

| Variable                 | Default                                | Purpose                                                 |
| ------------------------ | -------------------------------------- | ------------------------------------------------------- |
| `SITEHUB_DEV_PORT`       | `8111`                                 | UI development and start port                           |
| `SITEHUB_DEV_API_TARGET` | `http://localhost:${API_PORT ?? 3000}` | Backend destination for `/api/*` and `/health` rewrites |
| `API_PORT`               | `3000`                                 | Default backend port when no target is specified        |
| `SITEHUB_TEST_BROWSER`   | Playwright-managed Chromium            | Optional browser executable override for Playwright     |

Production rewrites are fixed when `next build` runs. Set `SITEHUB_DEV_API_TARGET` (or `API_PORT` when using the default target) **at build time**; changing these variables only when running `next start` does not update the built proxy destination. Rebuild to change it. Development rewrites are evaluated when `next dev` starts.

```sh
SITEHUB_DEV_API_TARGET=http://backend:3000 bun run build
bun run start
```

Next 16+ does not run ESLint during build; Biome is the only lint/format tool in this package.

All authentication and data fetching run in the browser through relative, same-origin URLs. There are no API route handlers or cookie-based page middleware. The backend session cookie is HttpOnly and scoped to `/api`; the client bootstraps with `/api/auth/session`. CSRF stays in module memory and rotates after password changes. A 401 clears the query cache and returns to the sign-in surface without losing the current URL. For change-password 401, a session probe distinguishes an incorrect current password from expiry. Theme preference is the only localStorage state.

Secrets are fetched on demand with `cache: 'no-store'`, held only in the mounted account drawer, and discarded after 30 seconds or unmount. They never enter React Query, browser storage, or logs. Account PATCH and website PATCH omit unchanged fields. Tag associations preserve the selected order.

## Structure

- `src/app`: thin route pages, root MUI cache integration and custom 404.
- `src/components/accounts`: account screen, statistics, toolbar, sortable table, list, actions, forms, detail drawer and delete dialog.
- `src/components/websites`: website screen, toolbar, pagination, card and form.
- `src/components/tags`, `auth`, `layout`, `common`: tag forms/manager, sign-in/password change, shell/providers and reusable controls.
- `src/lib/api`: typed discriminated results, CSRF/401 handling, query hooks, safe PATCH/query builders.
- `src/lib/validation`: validation aligned with backend normalization.
- `src/lib/copy.ts`: authored English UI copy.
- `src/theme`: shared light/dark MUI tokens, focus and reduced-motion styles.
- `tests`: security/contract and PasswordField unit checks and mocked API browser scenarios.

## Verification

```sh
bun install
bun run check
bun run typecheck
bun run build
bun run test
bun run test:e2e
```

If the environment denies writes to Bun's shared cache, set `BUN_INSTALL_CACHE_DIR="$PWD/.bun-cache"` and `BUN_TMPDIR="$PWD/.bun-tmp"` before installation. Both directories are ignored by Git and Biome.

Browser tests use API fixtures rather than a production database. Production rewrites and real backend/database behavior are outside this fixture suite. They cover session expiry and lockout messages, CSRF rotation, URL filters, minimal PATCH bodies, tag conflict/delete, account list/table, reveal timeout, typed deletion, theme selection, error recovery, inline field validation, external-resource privacy, and desktop/360px layouts. They start a production Next server at port 18111; build first. Install Chromium with `bunx playwright install chromium`, or set `SITEHUB_TEST_BROWSER` to an existing Chromium executable. Screenshots and temporary reports are written under `test-results/`.

The backend's actual login limiter, database persistence, encryption, and cookie issuance require integration testing against a separately provisioned backend. No production traffic, credentials or database records are changed by the fixture suite.
