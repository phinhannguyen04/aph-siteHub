# APH SiteHub

An internal website dashboard built with Vue 3, Vite, TypeScript, Bun, shadcn-vue, and Phosphor Icons. The backend uses NestJS with Fastify, Bun, TypeScript, and PostgreSQL. Website data comes from the API; the application contains no sample records.

## Project structure

```text
.
├── .env.example
├── backend/
│   ├── src/
│   │   ├── main.ts, app.module.ts, app.factory.ts
│   │   ├── config/{app-config,config.module,config.tokens}.ts
│   │   ├── database/{database.module,client,migrate,initial-migration}.ts
│   │   ├── common/errors/{api-error,result}.ts
│   │   ├── common/filters/api-exception.filter.ts
│   │   ├── auth/{auth.module,auth.controller,credentials.service,session,login-limiter,password-reset}.ts
│   │   ├── auth/entities/admin-credential.entity.ts
│   │   ├── auth/guards/session.guard.ts
│   │   ├── auth/dto/{login,change-password}.dto.ts
│   │   ├── websites/{websites.module,websites.controller,websites.service,website.interface,website-normalization,list-query,search}.ts
│   │   ├── websites/entities/{website,website-tag}.entity.ts
│   │   ├── websites/dto/{create-website,update-website}.dto.ts
│   │   ├── tags/{tags.module,tags.controller,tags.service,tag-normalization,tag.interface}.ts
│   │   ├── tags/entities/tag.entity.ts
│   │   ├── health/{health.module,health.controller}.ts
│   │   └── cli/{migrate,reset-password,hash-password}.ts
│   ├── test/api.test.ts
│   └── Dockerfile
├── frontend/
│   ├── src/components/{WebsiteCard,WebsiteForm,PasswordDialog,TagPicker,ManageTags}.vue
│   ├── src/components/ui/         # shadcn-vue component source
│   ├── src/{App,api,main,websites-state,style}.*
│   ├── test/websites-state.test.ts
│   ├── nginx.conf
│   └── Dockerfile
├── shared/result.ts
├── docker-compose.yml
└── docker-compose.dev.yml
```

## Backend architecture

`main.ts` starts the NestJS Fastify application. `AppModule` composes the feature modules, while `app.factory.ts` configures CORS, validation, and the API exception filter. The global `ConfigModule` provides validated environment settings. `DatabaseModule` provides a TypeORM DataSource using the pg driver and closes its owned connection during NestJS shutdown. Feature controllers retain the NestJS API from commit `cfe41cc`; services use TypeORM repositories injected directly with `@InjectRepository` and registered with `TypeOrmModule.forFeature`. Entity classes live in each feature module’s `entities/` directory (`auth`, `tags`, and `websites`); services contain their database operations without custom repository wrappers. Website/tag associations use foreign keys and cascade deletion of associations. TypeORM entities map to the existing PostgreSQL tables; `synchronize` is disabled. The initial TypeORM migration adopts existing tables and records its history in `typeorm_migrations`, leaving previous migration history intact. The `cli/` entrypoints run migrations and administrator maintenance without starting the HTTP server.

The root module accepts an existing database connection for isolated integration tests. Production bootstrapping creates and owns its connection. Existing authentication routes and website records remain compatible. The website list response now includes pagination metadata; clients must consume the updated shape.

## Error handling

Frontend API calls, backend services, configuration/validation helpers, database migrations and cleanup, password maintenance, `connectDb`, and `createApp` return a shared `Result<T, E>`: `{ code: 0, data }` on success or `{ code: 1, error }` on failure. Callers check `if (result.code !== 0)` before accessing `result.data`. Error details include a stable string `error.code`, `message`, and HTTP `status`; unexpected backend errors also retain their original `cause` for logging.

`attempt` adapts exception-based asynchronous libraries to return codes, including synchronous throws while starting an operation. `attemptSync` isolates the catch required by synchronous APIs such as `JSON.parse`. URL parsing uses `URL.parse` and checks for `null`. Business and infrastructure functions return errors as values. Only the NestJS HTTP adapter `httpData` throws `HttpException`; controllers, DTO transforms, and guards use it to translate returned failures into the existing API responses. Startup checks the database connection result before constructing the NestJS modules. HTTP response bodies remain unchanged. CLI commands return a nonzero exit code on failure and close their database connections before reporting the result.

## Configuration

Copy `.env.example` to `.env` if `.env` does not already exist. Git ignores `.env`. When upgrading an existing installation, keep the current `.env` so the PostgreSQL connection settings remain intact.

- `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` configure the PostgreSQL container. `DATABASE_URL` configures the backend (for example `postgresql://sitehub:password@postgres:5432/sitehub`). URL-encode password characters. The existing `.env` and `postgres_data` volume are reused; changing environment settings does not change credentials in an existing database.
- `ADMIN_PASSWORD_HASH_BASE64` is the Argon2id hash used to initialize the administrator account if `admin_credentials` has no record. After initialization, the current password is stored in PostgreSQL. Changing the hash in `.env` does not change the current password.
- `SESSION_SECRET` must contain at least 32 characters. Generate one with `openssl rand -hex 32`.
- For local HTTP, use `APP_ORIGIN=http://localhost:8111` and `COOKIE_SECURE=false`. If the dashboard is accessed through a LAN IP or another hostname, add the complete origins, including scheme and port, to comma-separated `APP_ORIGINS`. For HTTPS, set the actual origin and `COOKIE_SECURE=true`. Login and write requests require an allowed origin.

Generate the initial administrator password hash from a password of at least 12 characters:

```bash
read -r -s -p 'Administrator password: ' admin_password; printf '\n'
ADMIN_INITIAL_PASSWORD="$admin_password" bun backend/src/cli/hash-password.ts
unset admin_password
```

Copy the output into `ADMIN_PASSWORD_HASH_BASE64`. Never commit actual passwords or tokens or put them in `VITE_*` variables.

## Docker Compose

```bash
bun install
# Create .env from the example only if it does not already exist, then configure it.
cp -n .env.example .env
docker compose build
docker compose up -d --wait postgres
docker compose run --rm backend bun backend/dist/cli/migrate.js
docker compose up -d --wait
curl http://localhost:8111/health
```

Open `http://localhost:8111`. Only the frontend is published on port 8111; the backend and PostgreSQL stay on the Compose network. `docker compose down` preserves data. Avoid `docker compose down -v` if you want to keep the database. Use HTTPS in front of the application for public deployments.

### Change or reset the administrator password

While signed in, choose **Change password** and enter the current and new passwords. **Generate strong password** creates a random 24-character password in the form. After a change, the current session gets a new cookie and older sessions are invalidated.

If the administrator password is lost, run this command on the server:

```bash
docker compose run --rm backend bun backend/dist/cli/reset-password.js
```

The command creates a password and displays it once in the terminal. Save it securely. All previous sessions are invalidated. It uses the backend `.env` settings and requires the migrations to have run. There is no public password-reset endpoint.

## Local development with Bun

Stop the Compose frontend and backend if ports 8111 or 3000 are occupied. Expose PostgreSQL only on localhost with the development override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait postgres
DATABASE_URL='postgresql://sitehub:password@127.0.0.1:5432/sitehub' bun --env-file=.env backend/src/cli/migrate.ts
DATABASE_URL='postgresql://sitehub:password@127.0.0.1:5432/sitehub' bun --env-file=.env backend/src/main.ts
# In another terminal:
bun --cwd frontend dev
```

Vite proxies `/api` and `/health` to backend port 3000. Set `SITEHUB_DEV_PORT` and `SITEHUB_DEV_API_TARGET` to use an isolated development environment.

## API and manual checks

NestJS DTOs live in `backend/src/{auth,websites}/dto/`. `ValidationPipe` rejects unknown fields and normalizes website names and URLs before storage. The API provides health and authentication routes, paged website listing and count, website create/update, and tag CRUD as described below. Errors use `{ error: { code, message } }`.

1. Signed out: the sign-in form appears and `GET /api/websites` returns 401.
2. Signed in: the website count and cards reflect PostgreSQL data.
3. Add a website: empty names and invalid URLs show field errors; a successful save closes the form and updates the cards and count.
4. Search by name or URL, including accent-insensitive searches. Select the main card area to open a new tab; **Edit** opens only the edit form.
5. Edit a name or URL and save. Select **Refresh** to reload the list and count from the API.
6. On API failure, the old list disappears and **Try again** appears. An empty list offers **Add website**.
7. Change the password, confirm the old password no longer works and older sessions return 401, then sign out.

Session cookies use `HttpOnly`, `SameSite=Strict`, and `Secure` when `COOKIE_SECURE=true`. Write requests require an allowed origin and a CSRF token.

## Quality checks

```bash
bun run format:check
bun run lint
bun run typecheck
bun run build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait postgres
POSTGRES_TEST_URL='postgresql://sitehub:password@127.0.0.1:5432/sitehub' bun test
```

API tests create uniquely named disposable PostgreSQL databases and drop them after use. The test role needs CREATEDB; use a dedicated test server. If `POSTGRES_TEST_URL` is unset, the integration tests are skipped.

## Shared UI components

The interface uses shadcn-vue components stored in `frontend/src/components/ui/`:

- `Card` for the sign-in panel and website cards.
- `Alert` for API errors and save notifications.
- `Empty` for empty lists and searches with no results.
- `Skeleton` for loading states and `Badge` for search counts.
- `Field`, `FieldLabel`, and `FieldError` for forms and validation.
- `InputGroup` for search and password visibility controls.
- `Button`, `Input`, and `Dialog` for actions, input, and modal forms.

Components are added from the official registry with `bunx --bun shadcn-vue@latest add <component>` inside `frontend/`. Their source is committed locally; Reka UI supplies the underlying interaction primitives. Keep Phosphor icons and the shared theme in `frontend/src/style.css` when adding components. The stylesheet contains theme tokens, base styles, and the browser password-reveal override; layout uses Tailwind utilities.

Previous browser checks (before tag and pagination changes) covered sign-in, empty lists, add/edit validation, list/count updates, search, opening links, password controls, loading, API failure, and retry at 1440, 768, and 375 px. Screenshots: [desktop](artifacts/shadcn-desktop.png), [tablet](artifacts/shadcn-tablet.png), [mobile](artifacts/shadcn-mobile.png).

## Tags, filtering, and pagination

Run the migrations before starting the updated backend when upgrading an existing installation:

```bash
docker compose build backend
docker compose up -d --wait postgres
docker compose run --rm backend bun backend/dist/cli/migrate.js
docker compose up -d --wait
```

The initial TypeORM migration creates or adopts `websites`, `tags`, `website_tags`, and `admin_credentials`. Tags have stable UUIDs and unique normalized names; `website_tags` preserves their assignment order. Website create/update operations maintain `search_text`, including Vietnamese accent and đ/Đ folding. Migration only applies schema changes; re-running it preserves existing website, tag, and credential data.

Tag names are trimmed, leading `#` characters are removed, and names must contain 1–64 characters. Names are unique without regard to case. Descriptions allow up to 240 characters and colors must be six-digit hex values. The unique database index resolves concurrent duplicate creates. Tag deletion removes its ID from all websites in one transaction while preserving the websites.

The authenticated tag API uses `GET /api/tags`, `POST /api/tags`, `PATCH /api/tags/:id`, and `DELETE /api/tags/:id`. Create and update accept `{ name, description, color }`. Website create and update accept optional `tag_ids: string[]`; responses include `tag_ids` and expanded `tags`. All writes use the existing origin and CSRF checks. Errors retain `{ error: { code, message } }`.

`GET /api/websites` now returns `{ websites, total, page, pageSize }`. Query parameters are `page` (default 1), `pageSize` (default 12, maximum 48), `search`, and comma-separated `tagIds`. Tag filtering uses OR across selected tags, then AND with accent-insensitive name/URL search. Results are ordered by newest `created_at`, then `website_id` descending, before pagination. `total` counts filtered results; `GET /api/websites/count` continues to count all saved websites. The frontend keeps the search, tags, page, and page size in the URL query.
