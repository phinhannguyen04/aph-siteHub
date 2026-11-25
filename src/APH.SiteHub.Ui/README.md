# APH SiteHub UI

Single-page React (JavaScript) dashboard built with Vite and routed by React Router (`react-router`). Interactive primitives come from Base UI (`@base-ui/react`: Dialog, AlertDialog, Field, Select, Switch, Toggle/ToggleGroup, Tooltip, Toast). Server state uses TanStack Query, icons come from lucide-react and styling is plain hand-written CSS (`src/styles.css`) built on the Devlane "Drafts" design tokens (Inter 13px, oklch colours, 2–24px spacing scale, 6px radius, 150ms motion, light/dark themes). Requires Node.js 22+.

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
- `src/main.jsx`: mounts `BrowserRouter` with the routes: a shell layout, `/` websites, `/accounts` and a not-found page. Website filters live in the URL (`?page=2&search=…&tagIds=a,b`) through `useSearchParams`.
- `src/styles.css`: design tokens (`:root` / `[data-theme='dark']`) and all component styles. Base UI parts are styled through their `data-*` attributes (`data-pressed`, `data-checked`, `data-starting-style`, …).
- `src/components/ui/`: one file per shared control (`button.jsx`, `field.jsx`, `select.jsx`, `modal.jsx`, `confirm.jsx`, `tag-chip.jsx`, …) built on Base UI, plus `utils.js`; `index.js` re-exports them so pages import from `@/components/ui`.
- `src/components`: `notice.jsx` (query client, tooltip provider and toast) and `shell.jsx` (collapsible sidebar, top bar, theme switch).
  The sidebar collapses to an icon rail on desktop (state in `localStorage`, toggle with the top-bar button or Ctrl/Cmd + B) and becomes an off-canvas drawer below 860px.
- `src/pages`: `websites.jsx` and `accounts.jsx`.
- `src/features`: website, account and tag forms, account detail drawer and delete dialogs.
- `src/lib`: API client and helpers (`api.js`), validation, copy text, theme and the shared write hook.
- `tests`: `node --test` contract tests for the pure helpers (`npm test`).
