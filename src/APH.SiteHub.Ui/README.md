# APH SiteHub UI

Single-page React (JavaScript) dashboard built with Vite and routed by React Router (`react-router`). Interactive primitives come from Base UI (`@base-ui/react`: Dialog, AlertDialog, Field, Select, Switch, Toggle/ToggleGroup, Tooltip, Toast). Server state uses TanStack Query, icons come from lucide-react and styling is plain hand-written CSS (`src/styles/index.css`) built on the Apache Footwear Vietnam design tokens (Montserrat, orange accent, 3px radius, 200ms motion, light/dark themes). Requires Node.js 22+.

```sh
cd src/APH.SiteHub.Ui
npm install
npm run dev
```

Open `http://localhost:8111`. Start the ASP.NET Core backend separately using the repository README. Port 8111 must be available.

| Variable                 | Default                                | Purpose                                                            |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `SITEHUB_DEV_PORT`       | `8111`                                 | Dev and preview server port                                        |
| `SITEHUB_DEV_API_TARGET` | `http://localhost:${API_PORT ?? 3000}` | Backend destination for the dev/preview `/api` and `/health` proxy |
| `API_PORT`               | `3000`                                 | Default backend port when no target is specified                   |
| `SITEHUB_LAN_HOST`       | unset                                  | Extra hostname the Vite dev server accepts (LAN access)            |

`vite build` emits static files to `dist/`. In development and `vite preview`, `vite.config.js` proxies `/api` and `/health` to the backend. The production image (`Dockerfile`) serves `dist/` with nginx and proxies the same two paths to `http://backend:3000` (see `nginx.conf`), so the browser only ever talks to one origin.

There is no sign-in: every API call is a plain same-origin `fetch`. Anyone who can reach the UI can read and change all data, so run it only on a trusted network or put it behind your own access control. Theme preference is the only `localStorage` state.

Secrets are fetched on demand with `cache: 'no-store'`, held only in the mounted account drawer, and discarded after 30 seconds or unmount. They never enter React Query, browser storage, or logs. Account and website PATCH omit unchanged fields. Tag associations preserve the selected order.

## Structure

- `index.html`: Vite entry with the pre-paint theme script.
- `src/main.jsx`: entry point; mounts `<App />` from `src/app`.
- `src/app/`: `app.jsx` (`BrowserRouter` with the routes: a shell layout, `/` websites, `/accounts` and a not-found page) and `providers.jsx` (query client, tooltip provider and toast). Website filters live in the URL (`?page=2&search=…&tagIds=a,b`) through `useSearchParams`.
- `src/pages/`: route-level screens (`websites.jsx`, `accounts.jsx`, `not-found.jsx`) that only compose feature parts.
- `src/features/<name>/`: one folder per domain (`websites`, `accounts`, `tags`) with `components/`, `hooks/` and an `index.js` public API; other code imports a feature through `@/features/<name>`, never from its inner files.
- `src/components/ui/`: one file per shared control (`button.jsx`, `field.jsx`, `select.jsx`, `modal.jsx`, `confirm.jsx`, `tag-chip.jsx`, …) built on Base UI, plus `utils.js`; `index.js` re-exports them so pages import from `@/components/ui`.
- `src/components/layout/shell.jsx`: collapsible sidebar, top bar, theme switch. `src/components/notice.jsx`: toast hook and list.
  The sidebar collapses to an icon rail on desktop (state in `localStorage`, toggle with the top-bar button or Ctrl/Cmd + B) and becomes an off-canvas drawer below 860px.
- `src/hooks/`: hooks shared across features (`use-write.js`, the serialised write hook).
- `src/lib/`: framework-free helpers: API client (`api.js`), validation, copy text and theme.
- `src/styles/index.css`: design tokens (`:root` / `[data-theme='dark']`) and all component styles. Base UI parts are styled through their `data-*` attributes (`data-pressed`, `data-checked`, `data-starting-style`, …).
- `tests`: `node --test` contract tests for the pure helpers (`npm test`).
