# APH SiteHub

An internal website dashboard using Vue 3, Vite, TypeScript, shadcn-vue, and Phosphor Icons. The backend runs Hono and Zod on Bun and uses Drizzle ORM with PostgreSQL. The dashboard reads real records from the API.

## Backend layout

The TypeScript backend follows Go's package layout and composition style:

```text
backend/
├── cmd/
│   ├── server/main.ts          # Bun HTTP server and signal handling
│   ├── migrate/main.ts         # Apply PostgreSQL migrations
│   ├── resetpassword/main.ts   # Reset the administrator credential
│   └── hashpassword/main.ts    # Generate the initial password hash
├── internal/
│   ├── app/                   # Construct dependencies and register routes
│   ├── auth/                  # Session, CSRF, credential service and repository
│   ├── website/               # Website handler, schema, service and repository
│   ├── tag/                   # Tag handler, schema, service and repository
│   ├── database/              # PostgreSQL connection, Drizzle schema and migrations
│   ├── config/                # Environment configuration
│   ├── health/                # Database readiness endpoint
│   ├── http/                  # HTTP responses, context and Zod validation
│   ├── result/                # Return codes and exception adapters
│   └── testutil/              # Isolated database fixtures and HTTP test helpers
├── migrations/               # Generated SQL and Drizzle metadata
├── drizzle.config.ts
└── Dockerfile
```

Files use short package-local names such as `handler.ts`, `service.ts`, `repository.ts`, `schema.ts`, and `model.ts`. Tests sit next to the packages they exercise as `*.test.ts`. Entry points only compose and run the application. Handlers handle HTTP, services handle business rules, and repositories implement small interfaces using Drizzle. Dependencies are passed explicitly; no framework dependency injection is used. This layout is a convention in TypeScript, rather than Go's compiler-enforced `internal` visibility.

`createApp` returns `{ app, close }` inside a success result. `app` exposes Hono's Fetch API; `close` closes only connections created by the application. The Bun entrypoint drains the HTTP server and closes PostgreSQL on SIGINT/SIGTERM.

## Database and error handling

Drizzle manages the `websites`, `tags`, `website_tags`, and `admin_credentials` tables. The association table preserves tag order and uses foreign keys with cascading association deletion. Deleting a tag keeps its websites. Unique normalized tag names resolve concurrent creates. Website writes run in transactions; invalid tag references roll back both website changes and associations. List/count/hydration use one repeatable-read transaction for consistent pagination.

Services and repositories return `{ code: 0, data }` or `{ code: 1, error }`. Callers check `if (result.code !== 0)` before reading data. HTTP failures remain `{ error: { code, message } }`. PostgreSQL SQLSTATE codes are mapped to API validation/conflict errors at the repository boundary. HTTP validation uses `sValidator` from `@hono/standard-validator` with strict Zod schemas. Handlers read typed, normalized inputs using `c.req.valid('json')` and `c.req.valid('query')`. A shared validation hook preserves `{ error: { code, message } }` responses; JSON preparation preserves the existing 415 media-type and 400 malformed-JSON errors. Hono routes return HTTP errors directly. `attempt` adapts exception-based libraries, and `attemptSync` isolates synchronous APIs such as `JSON.parse`.

Runtime database queries and schema migrations use PostgreSQL and Drizzle exclusively.

## Configuration

For a new installation, copy `.env.example` to `.env` and configure it. For an upgrade, keep the existing PostgreSQL credentials, session secret, and administrator password hash.

- `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` configure the PostgreSQL container.
- `DATABASE_URL` configures the backend, for example `postgresql://sitehub:password@postgres:5432/sitehub`. URL-encode special password characters. The URL and container credentials must agree. Changing `.env` does not reset credentials in an existing PostgreSQL volume.
- `ADMIN_PASSWORD_HASH_BASE64` initializes the administrator if no credential exists. After initialization, the current hash/version live in PostgreSQL. Changing the environment hash does not change an existing password.
- `SESSION_SECRET` needs at least 32 characters. Keep it when importing existing sessions.
- `APP_ORIGIN` is the exact browser origin. Add other allowed origins to comma-separated `APP_ORIGINS`.
- For HTTP development, set `APP_ORIGIN=http://localhost:8111` and `COOKIE_SECURE=false`; HTTPS deployments should use secure cookies.
- `API_PORT` defaults to 3000.

Generate an initial Argon2id hash from a password of at least 12 characters:

```bash
read -r -s -p 'Administrator password: ' admin_password; printf '\n'
ADMIN_INITIAL_PASSWORD="$admin_password" bun backend/cmd/hashpassword/main.ts
unset admin_password
```

Set the output as `ADMIN_PASSWORD_HASH_BASE64` in `.env`.

## Fresh Docker installation

After configuring `.env`:

```bash
bun install --frozen-lockfile
docker compose build backend frontend
docker compose up -d --wait postgres
docker compose run --rm --no-deps backend bun backend/dist/migrate/main.js
docker compose up -d --wait backend frontend
curl -fsS http://localhost:8111/health
```

The dashboard is available on port 8111. PostgreSQL persists in the `postgres_data` volume. The backend and database are not published to the host by the production Compose file.

## Update an existing PostgreSQL installation

After reviewing schema migrations, build images, apply migrations, and recreate the application:

```bash
docker compose build backend frontend
docker compose up -d --wait postgres
docker compose run --rm --no-deps backend bun backend/dist/migrate/main.js
docker compose up -d --no-deps --force-recreate --wait backend frontend
curl -fsS http://localhost:8111/health
```

The database persists in `postgres_data`. PostgreSQL credentials and the session secret stay in the existing `.env`. Migration cutover snapshots and recovery artifacts are stored locally under the ignored `.migration-backups/` directory with restricted access; that directory is excluded from Docker build contexts.

## Local development

Expose PostgreSQL on localhost with the development override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait postgres
# Use the same PostgreSQL credentials, with localhost instead of the Compose hostname:
DATABASE_URL='postgresql://sitehub:password@127.0.0.1:5432/sitehub' bun --env-file=.env backend/cmd/migrate/main.ts
DATABASE_URL='postgresql://sitehub:password@127.0.0.1:5432/sitehub' bun --env-file=.env backend/cmd/server/main.ts
# In another terminal:
bun --cwd frontend dev
```

Vite proxies `/api` and `/health` to backend port 3000. `SITEHUB_DEV_PORT` and `SITEHUB_DEV_API_TARGET` support isolated development environments.

## Schema changes and maintenance

Edit `backend/internal/database/schema.ts`, generate and review the SQL, then apply it:

```bash
bun --cwd backend db:generate
bun --cwd backend migrate
```

Commit both the SQL and Drizzle metadata. Migrations are explicit; starting the server does not mutate the schema automatically.

Reset a lost password:

```bash
docker compose run --rm --no-deps backend bun backend/dist/resetpassword/main.js
```

The command prints the generated password once and changes the credential version, invalidating existing sessions. Signed-in users can also use **Change password** in the UI.

## API compatibility

Authentication and CSRF checks, cookie name/options, API routes, and response shapes remain compatible with the frontend:

- `/health`, `/api/auth/session`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`.
- `GET /api/websites` returns `{ websites, total, page, pageSize }`; `GET /api/websites/count` returns `{ count }`.
- Website create/update accept `name`, `url`, and optional `tag_ids`; responses include expanded tags.
- Tag CRUD uses `/api/tags` and `/api/tags/:id`, with `{ name, description, color }`.

Names/URLs/tags are normalized by strict Zod schemas. Unknown fields, invalid URLs, and empty website patches are rejected. Requests are limited to 1 MiB. Search is accent-insensitive and treats `%`/`_` literally. Tag filtering uses OR across selected tags and AND with text search. Results sort by `created_at` descending, then stable website ID descending. The frontend retains filters and pagination in the URL.

## Formatting and verification

Prettier is installed at the workspace root; `.prettierrc.json` and `.editorconfig` standardize two-space indentation, LF line endings, and trailing-newline behavior. Backend-specific formatting scripts are also available:

```bash
bun run format
bun run format:check
bun --cwd backend format:check
bun run lint
bun run typecheck
bun run build
bun test
POSTGRES_TEST_URL='postgresql://sitehub:password@127.0.0.1:5432/sitehub' bun test
```

Integration tests create disposable PostgreSQL databases with unique names and drop them afterward. The test role needs `CREATEDB`; use a dedicated test server. Without `POSTGRES_TEST_URL`, only database integration tests are skipped. Unit and HTTP middleware tests always run.

Frontend UI components remain in `frontend/src/components/ui/`, with the existing shadcn-vue theme and Phosphor icons.
