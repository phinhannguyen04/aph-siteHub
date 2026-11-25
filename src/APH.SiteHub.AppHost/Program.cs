using Aspire.Hosting.JavaScript;

// Local orchestration for development: `dotnet run --project src/APH.SiteHub.AppHost`.
// Production keeps using docker-compose.yml; the API and UI are unchanged and still read the same
// environment variables, Aspire only supplies them (plus the dashboard, telemetry and health gating).
const string appUser = "sitehub";
const string databaseName = "sitehub";

var builder = DistributedApplication.CreateBuilder(args);

// LAN access (optional): set LAN_HOST to this machine's LAN address (for example 10.30.0.15) and the UI is served
// on a fixed, unproxied port bound to all interfaces. Aspire's own proxy listens on localhost only. The API stays
// behind the UI's /api proxy, and the Aspire dashboard stays on localhost because it exposes logs and settings.
var lanHost = builder.Configuration["LAN_HOST"];
var lanPort = int.TryParse(builder.Configuration["LAN_PORT"], out var configuredPort) ? configuredPort : 8113;
string lanOrigin = $"http://{lanHost}:{lanPort}";

// Generated once and persisted to the AppHost user secrets, so the Postgres volume keeps working across runs.
var postgresPassword = builder.AddParameter(
    "postgres-password",
    new GenerateParameterDefault { MinLength = 24, Special = false },
    secret: true,
    persist: true);
// This cannot be generated: stored secrets must stay decryptable.
// Provide it with `dotnet user-secrets` (see README) or when the dashboard prompts for it.
var encryptionKey = builder.AddParameter("account-encryption-key", secret: true);

// The named volume keeps the database between runs. It is passed to docker directly: Aspire's
// WithDataVolume() left DCP's volume object "Pending" forever on this host.
var postgresUser = builder.AddParameter("postgres-user", appUser);
var postgres = builder.AddPostgres("postgres", postgresUser, postgresPassword)
    .WithImageTag("17-alpine")
    .WithContainerRuntimeArgs("--volume", "aph-sitehub-aspire-postgres-data:/var/lib/postgresql/data");
var database = postgres.AddDatabase(databaseName);

var databaseUrl = ReferenceExpression.Create(
    $"postgres://{appUser}:{postgresPassword}@{postgres.Resource.PrimaryEndpoint.Property(EndpointProperty.Host)}:{postgres.Resource.PrimaryEndpoint.Property(EndpointProperty.Port)}/{databaseName}");

IResourceBuilder<T> WithSiteHubSettings<T>(IResourceBuilder<T> resource, Func<EndpointReference> origin)
    where T : ProjectResource
{
    resource
        .WithEnvironment("DATABASE_URL", databaseUrl)
        .WithEnvironment("ACCOUNT_ENCRYPTION_KEY", encryptionKey)
        .WithEnvironment(context => context.EnvironmentVariables["APP_ORIGIN"] = origin());
    if (!string.IsNullOrWhiteSpace(lanHost))
    {
        // The API's CORS policy compares the browser's Origin header exactly, port included.
        resource.WithEnvironment("APP_ORIGINS", lanOrigin);
    }
    return resource;
}

IResourceBuilder<JavaScriptAppResource>? frontend = null;
EndpointReference FrontendOrigin() => frontend!.GetEndpoint("http");

// One-shot schema migration (the same `--migrate` command as `npm run migrate` / `compose run backend --migrate`).
var migrate = WithSiteHubSettings(
        builder.AddProject<Projects.APH_SiteHub_Api>("migrate").WithArgs("--migrate"), FrontendOrigin)
    .WaitFor(postgres)
    .WaitFor(database);

var backend = WithSiteHubSettings(
        builder.AddProject<Projects.APH_SiteHub_Api>("backend")
            // The API binds to API_PORT itself, so hand it the port Aspire allocated.
            .WithHttpEndpoint(env: "API_PORT"), FrontendOrigin)
    // /health is the database-backed readiness probe the API already exposes.
    .WithHttpHealthCheck("/health")
    .WaitForCompletion(migrate);

var web = builder.AddJavaScriptApp("frontend", "../APH.SiteHub.Ui", "dev").WithNpm();
web = string.IsNullOrWhiteSpace(lanHost)
    ? web.WithHttpEndpoint(env: "SITEHUB_DEV_PORT")
    : web.WithHttpEndpoint(port: lanPort, targetPort: lanPort, env: "SITEHUB_DEV_PORT", isProxied: false)
        // Lets the Vite dev server accept requests for this hostname (see vite.config.ts).
        .WithEnvironment("SITEHUB_LAN_HOST", lanHost);
frontend = web
    .WithExternalHttpEndpoints()
    // vite.config.ts proxies /api and /health to this target.
    .WithEnvironment("SITEHUB_DEV_API_TARGET", backend.GetEndpoint("http"))
    .WithHttpHealthCheck("/health")
    .WaitFor(backend);

builder.Build().Run();
