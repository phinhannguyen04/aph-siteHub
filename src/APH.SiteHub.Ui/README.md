# APH SiteHub UI

Single-page React + TypeScript dashboard built with Vite, routed by TanStack Router and styled with Tailwind CSS v4 and Headless UI (`@headlessui/react`) for accessible interactive primitives (icons: lucide-react). Server state uses TanStack Query. Requires Bun and Node.js 20.19+.

```sh
cd src/APH.SiteHub.Ui
bun install
bun run dev
```

Open `http://localhost:8111`. Start the ASP.NET Core backend separately using the repository README. Port 8111 must be available.

| Variable                 | Default                                | Purpose                                                            |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `SITEHUB_DEV_PORT`       | `8111`                                 | Dev and preview server port                                        |
| `SITEHUB_DEV_API_TARGET` | `http://localhost:${API_PORT ?? 3000}` | Backend destination for the dev/preview `/api` and `/health` proxy |
| `API_PORT`               | `3000`                                 | Default backend port when no target is specified                   |
| `SITEHUB_LAN_HOST`       | unset                                  | Extra hostname the Vite dev server accepts (LAN access)            |
| `SITEHUB_TEST_BROWSER`   | Playwright-managed Chromium            | Optional browser executable override for Playwright                |

`vite build` emits static files to `dist/`. In development and `vite preview`, `vite.config.ts` proxies `/api` and `/health` to the backend. The production image (`Dockerfile`) serves `dist/` with nginx and proxies the same two paths to `http://backend:3000` (see `nginx.conf`), so the browser only ever talks to one origin. Because the proxy is resolved at runtime, changing the backend address only needs an nginx config change, not a rebuild.

There is no sign-in: the app opens straight on the requested route and every API call is a plain same-origin `fetch`. Anyone who can reach the UI can read and change all data, so run it only on a trusted network or put it behind your own access control (reverse proxy, VPN). Theme preference is the only `localStorage` state.

Secrets are fetched on demand with `cache: 'no-store'`, held only in the mounted account drawer, and discarded after 30 seconds or unmount. They never enter React Query, browser storage, or logs. Account PATCH and website PATCH omit unchanged fields. Tag associations preserve the selected order.

## Structure

- `index.html`: Vite entry with the pre-paint theme script.
- `src/main.tsx`: mounts the router. `src/router.tsx`: code-based TanStack Router tree (root providers, pathless shell layout, `/` websites, `/accounts`, not-found). Search params stay plain strings so the website filter URL (`?page=2&search=…&tagIds=a,b`) is unchanged.
- `src/globals.css`: Tailwind with `sitehub-light`/`sitehub-dark` colour tokens.
- `src/components/accounts`: account screen, statistics, toolbar, sortable table, list, actions, forms, detail drawer and delete dialog.
- `src/components/websites`: website screen, toolbar, pagination, card and form.
- `src/components/tags`, `layout`, `common`: tag forms/manager, shell/providers and reusable Tailwind/Headless UI controls (`Button`, `Field`, `Modal` on Headless `Dialog`, `TagSelect` on Headless `Combobox`, `ToggleField` on `Switch`, `Confirm`, toast).
- `src/lib/api`: typed discriminated results, query hooks, safe PATCH/query builders.
- `src/lib/validation`: validation aligned with backend normalization.
- `src/lib/copy.ts`: authored English UI copy.
- `src/lib/theme.ts`: light/dark/system preference stored under `sitehub-theme`, applied as `data-theme` plus a `dark`/`light` class on `<html>`.
- `tests`: contract and PasswordField unit checks and mocked API browser scenarios.

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

Browser tests use API fixtures rather than a production database. The nginx proxy and real backend/database behavior are outside this fixture suite. They cover direct access with no sign-in, URL filters, minimal PATCH bodies, tag conflict/delete, account list/table, reveal timeout, typed deletion, theme selection, error recovery, inline field validation, external-resource privacy, and desktop/360px layouts. `test:e2e` builds the app and starts `vite preview` on port 18111. Install Chromium with `bunx playwright install chromium`, or set `SITEHUB_TEST_BROWSER` to an existing Chromium executable. Screenshots and temporary reports are written under `test-results/`.

Database persistence and encryption require integration testing against a separately provisioned backend. No production traffic, credentials or database records are changed by the fixture suite.
