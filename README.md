# APH SiteHub

An internal website and account dashboard with Vue 3, TypeScript and an ASP.NET Core 10 Minimal API. PostgreSQL stores the existing SiteHub data. Bun runs frontend tooling; the backend runs on .NET.

## Structure and architecture

```text
src/
  APH.SiteHub.Domain/          Entities/; one entity per file, no framework dependencies
  APH.SiteHub.Application/     Feature/use-case folders, Contracts/, Abstractions/ and Common/
  APH.SiteHub.Infrastructure/  Repositories, entity Configurations/, migrations and Security/
  APH.SiteHub.Api/             Endpoints/, Contracts/, Security/, Middleware/, ErrorHandling/ Commands/ and Http/
frontend/                     Vue application and same-origin API client
shared/                       Frontend Result helpers
tests/APH.SiteHub.Tests/       xUnit, legacy interoperability fixtures and PostgreSQL API tests
scripts/backend.ts            Pass workspace .env to .NET development/maintenance commands
APH.SiteHub.sln
```

Each entity, interface, DTO, command/query, handler and security component has its own file named after its type. A use case such as `Application/Websites/CreateWebsite/` contains separate `CreateWebsiteCommand.cs` and `CreateWebsiteHandler.cs`; shared feature responses live in `Contracts/`. Shared account validation lives independently in `Accounts/Validation/`, rather than inside a handler. Each persistence entity has a separate `IEntityTypeConfiguration<T>` in `Persistence/Configurations/`, discovered by `SiteHubDbContext`. `Program.cs` only composes startup; service registration, middleware, health routes and individual maintenance commands live in separate files. Existing namespaces remain compatible with EF snapshots and API consumers.

Dependencies point inward: Domain has no dependencies; Application references Domain; Infrastructure implements Application ports; Api is the composition root. Constructor injection registers scoped repositories and DbContext. Feature commands and queries have explicit `HandleAsync` handlers, without a mediator dependency. EF Core supplies change tracking and the unit of work; repository transactions cover website/tag writes, account updates, and optimistic credential replacement. Website PATCH locks the row. Website pagination, count and ordered tag hydration use one read-only repeatable-read snapshot.

Minimal API route groups require the ASP.NET authentication policy. The session authentication handler checks HMAC, expiry and the current credential version. An endpoint filter validates exact Origin and CSRF headers before mutations. Application handlers, repositories and password/secret services return `Result<T>`; validation and maintenance commands also use `Result`. `Error` carries a stable code, safe message and an `ErrorType`, without HTTP dependencies. `Map`/`Bind`/`BindAsync` preserve failures and skip downstream work. `ResultHttpExtensions` and `ErrorHttpMapper` translate results to the existing status codes and `{ error: { code, message } }` envelope; success payloads are unchanged. `DatabaseOperation` catches driver exceptions around the entire repository operation, after transaction rollback/disposal, translates unique/FK violations and hides unexpected details. Security adapters translate crypto/hash library failures into results. Cancellation propagates as `OperationCanceledException`; the exception handler remains a fallback for unexpected programming/framework errors. Startup configuration and invalid Result access still fail fast. Result-based JSON/query input parsing rejects unknown fields, duplicate keys, invalid types and null PATCH fields while preserving omitted fields.

The backend maps the existing tables and column types. It never calls `EnsureCreated` or automatically changes schema on normal startup. The adoption migration creates missing tables/indexes with `IF NOT EXISTS`, keeps existing rows and `typeorm_migrations`, and records EF history separately in `__EFMigrationsHistory`. Its Down operation refuses to drop adopted data. Subsequent schema changes should be new EF Core migrations, reviewed before applying.

## Development

Requirements: .NET 10 SDK, Bun, Docker Compose and PostgreSQL 17.

```bash
cp .env.example .env
bun install --frozen-lockfile
# Fill in database, session and encryption settings in .env.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

For a host-run backend, use a `DATABASE_URL` with `127.0.0.1:5433` rather than the Compose hostname `postgres`:

```bash
DATABASE_URL='postgresql://sitehub:password@127.0.0.1:5433/sitehub' bun run migrate
DATABASE_URL='postgresql://sitehub:password@127.0.0.1:5433/sitehub' bun run dev
# In another terminal:
bun run dev:frontend
```

The API listens on `API_PORT` (default 3000). Vite proxies `/api` and `/health` to this backend. `SITEHUB_DEV_API_TARGET` overrides that target; `SITEHUB_DEV_PORT` overrides the frontend port. Set `APP_ORIGIN` to the exact frontend origin (default example `http://localhost:8111`) and add other trusted origins via `APP_ORIGINS`.

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

Normal account responses exclude stored passwords and encrypted secrets. Only authenticated `GET /api/accounts/{id}/secret-key` reveals a secret, with `Cache-Control: no-store`. All API responses disable caching. Cookie flags are HttpOnly, SameSite=Strict and configurable Secure, with path `/api`. Enable `COOKIE_SECURE=true` behind HTTPS. Login blocks after five failed attempts for fifteen minutes. The limiter uses the actual connection IP and is in memory; behind Nginx the limit is shared by connections from that proxy. Forwarded IP headers are not trusted by default.

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

## Docker migration and deployment

Compose keeps the existing `postgres_data` volume and port `8111`. Nginx forwards `/api` and `/health` to the .NET backend on port 3000. The API uses a multi-stage .NET build, a non-root runtime user and a database-backed health probe. Frontend builds contain no NestJS workspace dependency.

Before applying the migration to a populated database, save a database backup in a protected location:

```bash
mkdir -p .migration-backups
chmod 700 .migration-backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > .migration-backups/pre-dotnet.dump
chmod 600 .migration-backups/pre-dotnet.dump
docker compose build backend frontend
docker compose run --rm backend --migrate
docker compose up -d backend frontend
docker compose ps
curl --fail http://localhost:8111/health
```

Do not remove PostgreSQL volumes. Source migration and image builds do not replace existing running containers until `up -d` is executed. Existing administrator hashes and account encryption keys must stay unchanged. Ordinary deployments apply explicitly reviewed migrations before starting the new API.

To add a future migration, restore the pinned local `dotnet-ef` tool and run:

```bash
dotnet tool restore
dotnet ef migrations add YourMigration --project src/APH.SiteHub.Infrastructure --output-dir Persistence/Migrations
```

Apply through the API `--migrate` command with the desired environment. The design-time factory uses an offline placeholder connection for scaffolding; it is not a deployment configuration.

## Verification

```bash
bun run build
bun run lint
bun run test
bun run format:check
```

Backend unit tests cover Result invariants, failure propagation, write prevention, driver-error mapping, cancellation, HTTP error categories, Node/Bun interoperability, encryption integrity, session signatures, URL normalization, search folding and login limit expiry. PostgreSQL API integration tests create and drop randomly named databases on the supplied test server, test fresh schema and legacy schema adoption, run migration twice, exercise CRUD/filtering/rollback, prevent secret leakage, reject Origin/CSRF violations and verify password-change session revocation.

Use **only a disposable test PostgreSQL server** with database creation permission:

```bash
POSTGRES_TEST_URL='postgresql://test_user:test_password@127.0.0.1:55432/sitehub_test' bun run test
```

Without `POSTGRES_TEST_URL`, the PostgreSQL integration tests are explicitly skipped. The unit and frontend tests still run. Tests never use `DATABASE_URL` to choose their test server.
