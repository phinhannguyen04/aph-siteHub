# APH SiteHub

An internal website and account dashboard with a React (JavaScript, Vite, React Router) single-page app and an ASP.NET Core 10 Web API built with MVC controllers. There is no sign-in: run it on a trusted network or behind your own access control. PostgreSQL stores the SiteHub data, accessed with Dapper and Npgsql. Node.js runs frontend tooling; the backend runs on .NET.

## Structure and architecture

```text
src/
  APH.SiteHub.Domain/          Entities/; one entity per file, no framework dependencies
  APH.SiteHub.Application/     Feature/use-case folders, Contracts/, Abstractions/ and Common/
  APH.SiteHub.Infrastructure/  Dapper repositories, SQL schema migrations and Security/
  APH.SiteHub.Api/             Endpoints/, Contracts/, Middleware/, ErrorHandling/ Commands/ and Http/
  APH.SiteHub.ServiceDefaults/ Shared .NET Aspire defaults: OpenTelemetry, service discovery, HTTP resilience, /alive
  APH.SiteHub.AppHost/         .NET Aspire orchestration for local development (Postgres, migration, API, UI, dashboard)
src/APH.SiteHub.Ui/           React (JavaScript) + React Router application (Vite, Biome); same-origin /api proxy via the Vite dev server and nginx
tests/APH.SiteHub.Tests/       xUnit, security interoperability fixtures and PostgreSQL API tests
scripts/backend.ts            Pass workspace .env to .NET development/maintenance commands
APH.SiteHub.sln
```

Each entity, interface, DTO, command/query, handler and security component has its own file named after its type. A use case such as `Application/Websites/CreateWebsite/` contains separate `CreateWebsiteCommand.cs` and `CreateWebsiteHandler.cs`; shared feature responses live in `Contracts/`. Shared account validation lives independently in `Accounts/Validation/`, rather than inside a handler. Repositories use Dapper with hand-written, parameterised PostgreSQL SQL; `Persistence/Sql.cs` holds the shared Dapper settings. `Program.cs` only composes startup; service registration, middleware, health routes and individual maintenance commands live in separate files. Existing namespaces remain compatible with API consumers.

Dependencies point inward: Domain has no dependencies; Application references Domain; Infrastructure implements Application ports; Api is the composition root. Constructor injection registers scoped repositories and a scoped `DbSession` (one lazily opened, pooled Npgsql connection per request). Feature commands and queries have explicit `HandleAsync` handlers, without a mediator dependency. Repository transactions cover website/tag writes, and account updates. Website and tag PATCH lock the row with `SELECT … FOR UPDATE`. Website pagination and count come from one `COUNT(*) OVER ()` statement, so they come from one snapshot; tags are then loaded for the page in a single query, ordered by position.

MVC controllers (`Controllers/`) are open: there is no authentication or authorization middleware. Application handlers, repositories and the secret service return `Result<T>`; validation and maintenance commands also use `Result`. `Error` carries a stable code, safe message and an `ErrorType`, without HTTP dependencies. `Map`/`Bind`/`BindAsync` preserve failures and skip downstream work. `ResultHttpExtensions` and `ErrorHttpMapper` translate results to the existing status codes and `{ error: { code, message } }` envelope; success payloads are unchanged. `DatabaseOperation` catches driver exceptions around the entire repository operation, after transaction rollback/disposal, translates PostgreSQL unique (23505) and foreign-key (23503) violations and hides unexpected details. Security adapters translate crypto library failures into results. Cancellation propagates as `OperationCanceledException`; the exception handler remains a fallback for unexpected programming/framework errors. Startup configuration and invalid Result access still fail fast. Result-based JSON/query input parsing rejects unknown fields, duplicate keys, invalid types and null PATCH fields while preserving omitted fields.

The schema lives in `Persistence/SchemaMigrations.cs` as ordered, append-only SQL steps applied by `DatabaseMigrator` and recorded in `schema_migrations`. It never changes schema on normal startup; run `npm run migrate` (the API `--migrate` command), which is safe to repeat; each step runs in a transaction. To change the schema, append a new entry; never edit one that has shipped.

PostgreSQL specifics that shape the code: `tags.description` is `NOT NULL DEFAULT ''`; account fields have explicit limits (password 256, secret key 1024, provider 128, login name and external ID 256, email 320 characters); `is_limit` is a `boolean`; tag and website timestamps remain ISO-8601 strings and account `created_at` is a UTC `timestamptz`; tag-ID lists are bound as arrays (`= ANY(@ids)`); `Sql.cs` maps snake_case columns to PascalCase row classes.

## Development

Requirements: .NET 10 SDK, Node.js 22+ (with npm) and Docker Compose. The database is the official `postgres:17-alpine` image.

```bash
cp .env.example .env
npm run install:all
# Fill in database and encryption settings in .env.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

Compose reports `postgres` as `healthy` within a few seconds. For a host-run backend, use a `DATABASE_URL` with `127.0.0.1:5432` rather than the Compose hostname `postgres`. The format is `postgres://user:password@host:port/database`, with the password URL-encoded. `npm run dev` and `npm run migrate` load `.env` automatically:

```bash
# .env: DATABASE_URL=postgres://sitehub:password@127.0.0.1:5432/sitehub
npm run migrate
npm run dev
# In another terminal:
npm run dev:frontend
```

The API listens on `API_PORT` (default 3000). The Vite dev server proxies `/api` and `/health` to this backend. `SITEHUB_DEV_API_TARGET` overrides that target; `SITEHUB_DEV_PORT` overrides the frontend port. `APP_ORIGIN` (default example `http://localhost:8111`) and `APP_ORIGINS` list the browser origins the API's CORS policy allows; the UI normally reaches the API through its own same-origin proxy, so CORS only matters if a browser calls the API from another origin.

With exported environment settings, .NET can also run directly:

```bash
dotnet run --project src/APH.SiteHub.Api -- --migrate
dotnet run --project src/APH.SiteHub.Api
```

Development exposes `/openapi/v1.json`. Production does not expose OpenAPI.

## Running with .NET Aspire

The `APH.SiteHub.AppHost` project starts the whole stack for development and opens the Aspire dashboard (resources, console logs, structured logs, traces and metrics for the API):

```bash
dotnet user-secrets --project src/APH.SiteHub.AppHost set Parameters:account-encryption-key "$(openssl rand -hex 32)"
npm run aspire      # same as: dotnet run --project src/APH.SiteHub.AppHost
```

It runs, in order: a Postgres container (`17-alpine`, the named volume `aph-sitehub-aspire-postgres-data`), a one-shot `migrate` resource (`--migrate`), the `backend` API and the `frontend` (`npm run dev`). `migrate` waits for the database resource; the backend is then gated on its database-backed `/health`. Ports are allocated by Aspire and shown in the dashboard, so it does not collide with the Compose stack on 8111.

- `postgres-password` is generated on first run and persisted in the AppHost user secrets. `account-encryption-key` cannot be generated, so supply it as above (the dashboard prompts if it is missing). Keep the encryption key stable: stored account secrets are decrypted with it.
- The generated database password contains only letters and digits, which keeps `DATABASE_URL` valid without URL-encoding.
- The API adds `APH.SiteHub.ServiceDefaults`: OpenTelemetry traces, metrics and logs are exported over OTLP only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (Aspire sets it), `/health` and `/alive` requests are filtered out of traces, and `/alive` is a dependency-free liveness probe exposed in Development only. Outside Aspire nothing changes.
- **LAN access:** `LAN_HOST=<this machine's LAN IP> npm run aspire` serves the UI on a fixed port (`LAN_PORT`, default 8113) bound to all interfaces, so other machines open `http://<LAN_HOST>:8113`. The AppHost also adds that origin to `APP_ORIGINS` (the API's CORS policy compares the browser `Origin` exactly, port included) and passes the host to the Vite dev server as `SITEHUB_LAN_HOST` so it accepts requests for that hostname. Only the UI is exposed: the API stays behind the UI's `/api` proxy and the Aspire dashboard stays on localhost. The connection is plain http, so use a trusted network. Allow the port in the host firewall, for example (match the subnet of this machine, `ip -4 -br addr`) `sudo ufw allow from 10.30.0.0/22 to any port 8112 proto tcp`.
- The AppHost dashboard (Resources, console logs, start/stop) is at `http://localhost:15181`, localhost only (the plain-http launch profile is first, so no trusted dev certificate is needed; the login link with its token is printed on start). From another machine use an SSH tunnel (`ssh -L 15181:localhost:15181 <user>@<host>`). The always-on dashboard for the Compose deployment is the separate container on port 15180 (see below).
- `WithDataVolume()` is deliberately not used because it failed on a previous host (DCP left the volume "Pending" forever); `Program.cs` passes a plain `docker --volume` mount instead.
- Not covered: database-level (Npgsql) tracing and browser telemetry. The AppHost is for local development; deployment is still `docker compose` below.

## Access and secrets

The API and UI have **no authentication**: every endpoint is open to whoever can reach it, including `GET /api/accounts/{id}/secret-key`, which reveals stored account secrets. Keep the UI and API on a trusted network (or behind a VPN or an authenticating reverse proxy) and never publish them to the Internet.

`ACCOUNT_ENCRYPTION_KEY` is 64 hexadecimal characters and must be provisioned outside source control (`openssl rand -hex 32`). Keep it unchanged across deployments: stored account secrets are decrypted with it. AES-256-GCM uses the Node-compatible `v1.nonce.tag.ciphertext` envelope and account-ID associated data.

Normal account responses exclude stored passwords and encrypted secrets. Secret reveals use `Cache-Control: no-store`, and all API responses disable caching.

The `admin_credentials` table created by the first migration is no longer used. It is left in place (migrations are append-only and this avoids deleting data); drop it manually if you want it gone.

## API contract

Requests need no session, cookie or token. `pageSize` retains camelCase; entity fields retain snake_case.

| Method       | Path                                  | Response                              |
| ------------ | ------------------------------------- | ------------------------------------- |
| GET          | `/health`                             | `{ status: 'ok' }`, or 503            |
| GET          | `/api/websites`                       | `{ websites, total, page, pageSize }` |
| GET          | `/api/websites/count`                 | `{ count }`                           |
| POST / PATCH | `/api/websites`, `/api/websites/{id}` | `{ website }`                         |
| DELETE       | `/api/websites/{id}`                  | `{ ok: true }`                        |
| GET          | `/api/tags`                           | `{ tags }`                            |
| POST / PATCH | `/api/tags`, `/api/tags/{id}`         | `{ tag }`                             |
| DELETE       | `/api/tags/{id}`                      | `{ ok: true }`                        |
| GET          | `/api/accounts`                       | `{ accounts }`                        |
| GET          | `/api/accounts/stats`                 | `{ stats }`                           |
| GET          | `/api/accounts/{id}`                  | `{ account }`                         |
| POST / PATCH | `/api/accounts`, `/api/accounts/{id}` | `{ account }`                         |
| GET          | `/api/accounts/{id}/secret-key`       | `{ secret_key }`, no-store            |
| DELETE       | `/api/accounts/{id}`                  | `{ ok: true }`                        |

Website filters support `page` (1–1,000,000), `pageSize` (1–48, default 12), `search` (up to 160 characters) and comma-separated `tagIds` (up to 50 distinct UUIDv4 IDs, any selected tag). Search folds Vietnamese accents. Associations preserve submitted tag order. Website/tag POST returns 201; account POST returns 201. Account PATCH supports only `password`, `secret_key` and `is_limit`.

## Docker deployment

Compose runs the `postgres` service (volume `postgres_data`, user/password/database from `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`) and publishes the UI on port `8111`. The UI container (static build served by nginx, container port 3000, published as 8111) forwards `/api` and `/health` to the .NET backend on port 3000. The API uses a multi-stage .NET build, a non-root runtime user and a database-backed health probe.

```bash
docker compose build backend frontend
docker compose up -d postgres
docker compose run --rm backend --migrate
docker compose up -d backend frontend
docker compose ps
curl --fail http://localhost:8111/health
```

`POSTGRES_PASSWORD` is applied only when the data directory is first initialised. Changing it later requires `ALTER USER` in the database as well as updating `DATABASE_URL`. Do not remove the `postgres_data` volume. Keep `ACCOUNT_ENCRYPTION_KEY` unchanged across deployments: encrypted secrets stay readable.

### Aspire Dashboard container

Compose also runs the standalone Aspire Dashboard (`dashboard` service, image `mcr.microsoft.com/dotnet/aspire-dashboard`) on `http://<host>:15180`. It has no login (`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS`): opening the URL is enough. The backend exports its logs, traces and metrics to it over OTLP (`OTEL_EXPORTER_OTLP_ENDPOINT=http://dashboard:18889`, reachable only inside the Compose network). Docker publishes the port itself, so no `ufw` rule is needed. Anyone who can reach the port sees logs and traces over plain http, so keep it on a trusted network; to require a token again, replace that variable with `DASHBOARD__FRONTEND__AUTHMODE=BrowserToken` and `DASHBOARD__FRONTEND__BROWSERTOKEN=<secret>`.

The standalone dashboard shows telemetry only. The Resources page, per-process console logs and start/stop exist only when the AppHost orchestrates the processes (`npm run aspire`, dashboard on `http://localhost:15181`). Compose containers are started by Docker, not by the AppHost, so the AppHost knows nothing about them.

### Moving existing Oracle data

The previous Oracle volume is not read by this version. To keep data, export each table (`tags`, `websites`, `website_tags`, `accounts`) from Oracle and load it into PostgreSQL after `--migrate`, preserving values exactly (ids and the encrypted `secret_key_encrypted` envelopes). Load `tags` and `websites` before `website_tags`. Render `tags.description IS NULL` as `''`, convert `accounts.is_limit` (`0`/`1`) to a boolean, and keep `accounts.created_at` in UTC.

## Verification

```bash
npm run build
npm run lint
npm run test
npm run format:check
```

Backend unit tests cover Result invariants, failure propagation, write prevention, PostgreSQL error translation, cancellation, HTTP error categories, Node interoperability, encryption integrity, URL normalization and search folding. PostgreSQL API integration tests create a random database per test and drop it afterwards, run the migration twice, check seeded data with a stored encrypted secret, exercise CRUD/filtering/paging/rollback and LIKE-wildcard escaping, and prevent secret leakage. UI contract tests (`node --test`) cover the filter, patch and validation helpers.

Use **only a disposable test PostgreSQL server** and an administrative account (for example `postgres`) that may create and drop databases:

```bash
docker run -d --name sitehub-pg-test -p 127.0.0.1:55432:5432 -e POSTGRES_PASSWORD=change-me postgres:17-alpine
POSTGRES_TEST_URL='postgres://postgres:change-me@127.0.0.1:55432/postgres' npm run test
```

Without `POSTGRES_TEST_URL`, the PostgreSQL integration tests are explicitly skipped. The unit and UI contract tests still run. Tests never use `DATABASE_URL` to choose their test server.
