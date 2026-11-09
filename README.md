# APH SiteHub

An internal website and account dashboard with Next.js, MUI and an ASP.NET Core 10 Minimal API. Oracle Database Free stores the SiteHub data, accessed with Dapper. Bun runs frontend tooling; the backend runs on .NET.

## Structure and architecture

```text
src/
  APH.SiteHub.Domain/          Entities/; one entity per file, no framework dependencies
  APH.SiteHub.Application/     Feature/use-case folders, Contracts/, Abstractions/ and Common/
  APH.SiteHub.Infrastructure/  Dapper repositories, SQL schema migrations and Security/
  APH.SiteHub.Api/             Endpoints/, Contracts/, Security/, Middleware/, ErrorHandling/ Commands/ and Http/
src/APH.SiteHub.Ui/           Next.js + MUI application (Biome); same-origin /api proxy via Next rewrites
tests/APH.SiteHub.Tests/       xUnit, security interoperability fixtures and Oracle API tests
scripts/backend.ts            Pass workspace .env to .NET development/maintenance commands
docker/oracle/init/           Startup script that creates the least-privilege Oracle application user
APH.SiteHub.sln
```

Each entity, interface, DTO, command/query, handler and security component has its own file named after its type. A use case such as `Application/Websites/CreateWebsite/` contains separate `CreateWebsiteCommand.cs` and `CreateWebsiteHandler.cs`; shared feature responses live in `Contracts/`. Shared account validation lives independently in `Accounts/Validation/`, rather than inside a handler. Repositories use Dapper with hand-written, parameterised Oracle SQL; `Persistence/Sql.cs` holds the shared Dapper settings. `Program.cs` only composes startup; service registration, middleware, health routes and individual maintenance commands live in separate files. Existing namespaces remain compatible with API consumers.

Dependencies point inward: Domain has no dependencies; Application references Domain; Infrastructure implements Application ports; Api is the composition root. Constructor injection registers scoped repositories and a scoped `DbSession` (one lazily opened, pooled Oracle connection per request). Feature commands and queries have explicit `HandleAsync` handlers, without a mediator dependency. Repository transactions cover website/tag writes, account updates, and optimistic credential replacement. Website and tag PATCH lock the row with `SELECT … FOR UPDATE`. Website pagination and count come from one `COUNT(*) OVER ()` statement, so they are consistent under Oracle read consistency; tags are then loaded for the page in a single query, ordered by position.

Minimal API route groups require the ASP.NET authentication policy. The session authentication handler checks HMAC, expiry and the current credential version. An endpoint filter validates exact Origin and CSRF headers before mutations. Application handlers, repositories and password/secret services return `Result<T>`; validation and maintenance commands also use `Result`. `Error` carries a stable code, safe message and an `ErrorType`, without HTTP dependencies. `Map`/`Bind`/`BindAsync` preserve failures and skip downstream work. `ResultHttpExtensions` and `ErrorHttpMapper` translate results to the existing status codes and `{ error: { code, message } }` envelope; success payloads are unchanged. `DatabaseOperation` catches driver exceptions around the entire repository operation, after transaction rollback/disposal, translates Oracle unique (ORA-00001) and parent-key (ORA-02291) violations and hides unexpected details. Security adapters translate crypto/hash library failures into results. Cancellation propagates as `OperationCanceledException`; the exception handler remains a fallback for unexpected programming/framework errors. Startup configuration and invalid Result access still fail fast. Result-based JSON/query input parsing rejects unknown fields, duplicate keys, invalid types and null PATCH fields while preserving omitted fields.

The schema lives in `Persistence/SchemaMigrations.cs` as ordered, append-only SQL steps applied by `DatabaseMigrator` and recorded in `schema_migrations`. It never changes schema on normal startup; run `bun run migrate` (the API `--migrate` command), which is safe to repeat. `CREATE TABLE IF NOT EXISTS` requires Oracle Database 23ai or newer, which the Free image provides. To change the schema, append a new entry; never edit one that has shipped.

Oracle specifics that shape the code: an empty string is stored as `NULL`, so `tags.description` is nullable and read back as `""`; `VARCHAR2` columns are capped at 4000 bytes, so account fields have explicit limits (password 256, secret key 1024, provider 128, login name and external ID 256, email 320 characters); booleans are `NUMBER(1)`; tag and website timestamps remain ISO-8601 strings and account `created_at` is a UTC `TIMESTAMP`; ODP.NET needs `BindByName` for named parameters, which `Sql.cs` sets for every command.

## Development

Requirements: .NET 10 SDK, Bun and Docker Compose. The database is the official Oracle Database Free image (`container-registry.oracle.com/database/free:latest-lite`, anonymous pull).

```bash
cp .env.example .env
bun install --frozen-lockfile
# Fill in database, session and encryption settings in .env.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d oracle
```

The first start takes a couple of minutes while Oracle initialises; Compose reports `healthy` when it is ready, and a startup script creates the `ORACLE_APP_USER` schema. For a host-run backend, use a `DATABASE_URL` with `127.0.0.1:1521` rather than the Compose hostname `oracle`. The format is `oracle://user:password@host:port/service_name` (service `FREEPDB1`), with the password URL-encoded:

```bash
DATABASE_URL='oracle://sitehub:password@127.0.0.1:1521/FREEPDB1' bun run migrate
DATABASE_URL='oracle://sitehub:password@127.0.0.1:1521/FREEPDB1' bun run dev
# In another terminal:
bun run dev:frontend
```

The API listens on `API_PORT` (default 3000). Next.js rewrites proxy `/api` and `/health` to this backend (the target is fixed at build time). `SITEHUB_DEV_API_TARGET` overrides that target; `SITEHUB_DEV_PORT` overrides the frontend port. Set `APP_ORIGIN` to the exact frontend origin (default example `http://localhost:8111`) and add other trusted origins via `APP_ORIGINS`.

With exported environment settings, .NET can also run directly:

```bash
dotnet run --project src/APH.SiteHub.Api -- --migrate
dotnet run --project src/APH.SiteHub.Api
```

Development exposes `/openapi/v1.json`. Production does not expose OpenAPI.

## Administrator credentials and secrets

Keep the existing `SESSION_SECRET` and `ACCOUNT_ENCRYPTION_KEY` during migration. The key is 64 hexadecimal characters and must be provisioned outside source control (`openssl rand -hex 32`). Existing Bun Argon2id hashes and signed eight-hour cookies remain readable. Password replacement changes the credential version and revokes prior sessions. AES-256-GCM retains the Node-compatible `v1.nonce.tag.ciphertext` envelope and account-ID associated data.

Generate an initial hash without putting a password in shell history:

```bash
read -r -s -p 'Initial administrator password: ' sitehub_password
printf '\n'
printf '%s\n' "$sitehub_password" | bun run hash-password
unset sitehub_password
```

Put the output base64 hash into `ADMIN_PASSWORD_HASH_BASE64`. It initializes a missing administrator only; it never replaces existing credentials. Minimum new password length is 12, maximum 256. To reset an existing administrator, pass the password on stdin to `bun run reset-password` (host database URL required), or:

```bash
read -r -s -p 'Replacement administrator password: ' sitehub_password
printf '\n'
printf '%s\n' "$sitehub_password" | docker compose run --rm -T backend --reset-password
unset sitehub_password
```

Normal account responses exclude stored passwords and encrypted secrets. Only authenticated `GET /api/accounts/{id}/secret-key` reveals a secret, with `Cache-Control: no-store`. All API responses disable caching. Cookie flags are HttpOnly, SameSite=Strict and configurable Secure, with path `/api`. Enable `COOKIE_SECURE=true` behind HTTPS. Login is rate limited by ASP.NET Core `AddRateLimiter` (fixed window): at most five login requests per fifteen minutes per IP, after which it returns 429 `RATE_LIMITED` with a `Retry-After` header. Every login request counts, successful or not. The limiter uses the actual connection IP and is in memory; behind the Next.js proxy the limit is shared by connections from that proxy. Forwarded IP headers are not trusted by default.

## API contract

All existing paths and response field names are preserved. Mutations require the session cookie, exact `Origin` and `x-csrf-token`; login requires Origin. `csrfToken` and `pageSize` retain camelCase; entity fields retain snake_case.

| Method       | Path                                  | Response                              |
| ------------ | ------------------------------------- | ------------------------------------- |
| GET          | `/health`                             | `{ status: 'ok' }`, or 503            |
| POST         | `/api/auth/login`                     | `{ csrfToken }` and cookie            |
| GET          | `/api/auth/session`                   | `{ csrfToken }`                       |
| POST         | `/api/auth/logout`                    | `{ ok: true }`                        |
| POST         | `/api/auth/change-password`           | `{ csrfToken }` and renewed cookie    |
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

Compose runs the `oracle` service (volume `oracle_data`, SYS/SYSTEM password `ORACLE_PWD`, application schema `ORACLE_APP_USER`/`ORACLE_APP_PASSWORD`) and publishes the UI on port `8111`. The Next.js server (standalone image, container port 3000, published as 8111) forwards `/api` and `/health` to the .NET backend on port 3000. The API uses a multi-stage .NET build, a non-root runtime user and a database-backed health probe. The application connects as the least-privilege schema user (`CREATE SESSION`, `CREATE TABLE`), never as SYSTEM. The lite image has no `USERS` tablespace; the startup script uses the PDB default.

```bash
docker compose build backend frontend
docker compose up -d oracle
docker compose run --rm backend --migrate
docker compose up -d backend frontend
docker compose ps
curl --fail http://localhost:8111/health
```

`ORACLE_APP_PASSWORD` is applied only when the user is first created. Changing it later requires `ALTER USER` in the database as well as updating `DATABASE_URL`. Do not remove the `oracle_data` volume. Keep the administrator hash and `ACCOUNT_ENCRYPTION_KEY` unchanged across deployments: stored hashes and encrypted secrets stay readable.

### Moving existing PostgreSQL data

The previous PostgreSQL volume is not read by this version. To keep data, export each table (`admin_credentials`, `tags`, `websites`, `website_tags`, `accounts`) from PostgreSQL and load it into the Oracle schema after `--migrate`, preserving values exactly (ids, the Argon2 hash and the encrypted `secret_key_encrypted` envelopes). Load `tags` and `websites` before `website_tags`. Render `tags.description = ''` as `NULL`, and convert `accounts.created_at` to UTC.

## Verification

```bash
bun run build
bun run lint
bun run test
bun run format:check
```

Backend unit tests cover Result invariants, failure propagation, write prevention, Oracle error translation, cancellation, HTTP error categories, Node/Bun interoperability, encryption integrity, session signatures, URL normalization, search folding and login limit expiry. Oracle API integration tests create a random schema user per test and drop it afterwards, run the migration twice, check seeded data with the stored Argon2 hash and encrypted secret, exercise CRUD/filtering/paging/rollback and LIKE-wildcard escaping, prevent secret leakage, reject Origin/CSRF violations and verify password-change session revocation.

Use **only a disposable test Oracle database** and an administrative account (for example `system`) that may create and drop users:

```bash
docker run -d --name sitehub-oracle-test -p 127.0.0.1:15210:1521 -e ORACLE_PWD=change-me container-registry.oracle.com/database/free:latest-lite
ORACLE_TEST_URL='oracle://system:change-me@127.0.0.1:15210/FREEPDB1' bun run test
```

Without `ORACLE_TEST_URL`, the Oracle integration tests are explicitly skipped. The unit and UI contract tests still run. Tests never use `DATABASE_URL` to choose their test server.
