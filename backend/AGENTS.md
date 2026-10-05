# Backend conventions

Use documented Hono facilities before introducing custom infrastructure. Consult the official documentation and the installed package APIs when changing middleware behavior.

- Validate HTTP JSON, query, header, cookie, and parameter inputs with `@hono/standard-validator` and Zod; read normalized values with `c.req.valid()`.
- Let Hono parse request bodies. Do not add a preliminary JSON parser or duplicate content-type recognition. Adapt validation failures through documented hooks.
- Use `hono/cookie` to read, set, and delete cookies. Use Hono JWT middleware/helpers for signing, signature verification, and expiry; pin the accepted algorithm explicitly. Do not write custom session cryptography.
- Use built-in CORS, body-limit, CSRF, and middleware-combination facilities. Hono CSRF covers form-compatible requests, so retain the application's JSON Origin and session-token constraints using header validators.
- Use `@hono/bun` ConnInfo for runtime connection information. Only trust proxy headers under the existing private Nginx topology.
- Use a rate-limiter middleware listed in Hono's third-party documentation rather than maintaining a custom counter map. Preserve the intended failure-count/reset policy and dispose store resources on shutdown.
- Handle native HTTP failures with `HTTPException` and `app.onError`. Keep only the adapter needed for the application's JSON error envelope.
- Keep credential-version revocation, authorization policies, database operations, and API response shaping in the application's packages; these are business rules rather than framework behavior.
- Services and repositories retain return-code results. Framework middleware may raise native HTTP exceptions, which belong at the HTTP boundary.
- Keep Go-style `cmd/` entrypoints, domain packages under `internal/`, small repository interfaces, and colocated `*.test.ts` files.
- Run relevant tests, typecheck, lint, format checks, and build. Exercise auth, cookies, CSRF, and invalid input through Hono's `app.request()` and isolated PostgreSQL fixtures when those behaviors change.

References:

- https://hono.dev/docs/guides/validation
- https://hono.dev/docs/helpers/cookie
- https://hono.dev/docs/middleware/builtin/jwt
- https://hono.dev/docs/middleware/builtin/csrf
- https://hono.dev/docs/middleware/builtin/combine
- https://hono.dev/docs/helpers/conninfo
- https://hono.dev/docs/api/exception
- https://hono.dev/docs/middleware/third-party
