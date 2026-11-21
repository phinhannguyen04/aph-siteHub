using Aspire.Hosting.JavaScript;

// Local orchestration for development: `dotnet run --project src/APH.SiteHub.AppHost`.
// Production keeps using docker-compose.yml; the API and UI are unchanged and still read the same
// environment variables, Aspire only supplies them (plus the dashboard, telemetry and health gating).
const string appUser = "sitehub";
const string oracleService = "FREEPDB1";

var builder = DistributedApplication.CreateBuilder(args);

// LAN access (optional): set LAN_HOST to this machine's LAN address (for example 10.30.0.15) and the UI is served
// on a fixed, unproxied port bound to all interfaces. Aspire's own proxy listens on localhost only. The API stays
// behind the UI's /api proxy, and the Aspire dashboard stays on localhost because it exposes logs and settings.
var lanHost = builder.Configuration["LAN_HOST"];
var lanPort = int.TryParse(builder.Configuration["LAN_PORT"], out var configuredPort) ? configuredPort : 8112;
string lanOrigin = $"http://{lanHost}:{lanPort}";

// Generated once and persisted to the AppHost user secrets, so the Oracle volume keeps working across runs.
var oraclePassword = builder.AddParameter(
    "oracle-password",
    new GenerateParameterDefault { MinLength = 24, Special = false },
    secret: true,
    persist: true);
var appPassword = builder.AddParameter(
    "oracle-app-password",
    new GenerateParameterDefault { MinLength = 24, Special = false },
    secret: true,
    persist: true);
var sessionSecret = builder.AddParameter(
    "session-secret",
    new GenerateParameterDefault { MinLength = 48, Special = false },
    secret: true,
    persist: true);
// These cannot be generated: stored secrets must stay decryptable, and the admin hash is yours.
// Provide them with `dotnet user-secrets` (see README) or when the dashboard prompts for them.
var encryptionKey = builder.AddParameter("account-encryption-key", secret: true);
var adminHashBase64 = builder.AddParameter("admin-password-hash-base64", secret: true);

var oracle = builder.AddOracle("oracle", oraclePassword)
    .WithImageTag("latest-lite")
    .WithDataVolume()
    // Idempotent script that creates the least-privilege schema user, same one docker-compose mounts.
    .WithInitFiles(Path.Combine(builder.AppHostDirectory, "..", "..", "docker", "oracle", "init"))
    .WithEnvironment("ORACLE_APP_USER", appUser)
    .WithEnvironment("ORACLE_APP_PASSWORD", appPassword);
var database = oracle.AddDatabase("sitehub", oracleService);

var databaseUrl = ReferenceExpression.Create(
    $"oracle://{appUser}:{appPassword}@{oracle.Resource.PrimaryEndpoint.Property(EndpointProperty.Host)}:{oracle.Resource.PrimaryEndpoint.Property(EndpointProperty.Port)}/{oracleService}");

IResourceBuilder<T> WithSiteHubSettings<T>(IResourceBuilder<T> resource, Func<EndpointReference> origin)
    where T : ProjectResource
{
    resource
        .WithEnvironment("DATABASE_URL", databaseUrl)
        .WithEnvironment("SESSION_SECRET", sessionSecret)
        .WithEnvironment("ACCOUNT_ENCRYPTION_KEY", encryptionKey)
        .WithEnvironment("ADMIN_PASSWORD_HASH_BASE64", adminHashBase64)
        .WithEnvironment(context => context.EnvironmentVariables["APP_ORIGIN"] = origin());
    if (!string.IsNullOrWhiteSpace(lanHost))
    {
        // The API compares the browser's Origin header exactly, port included.
        resource.WithEnvironment("APP_ORIGINS", lanOrigin);
    }
    if (builder.ExecutionContext.IsRunMode)
    {
        // Locally everything is served over plain http, so Secure cookies would never be sent back.
        resource.WithEnvironment("COOKIE_SECURE", "false");
    }
    return resource;
}

IResourceBuilder<JavaScriptAppResource>? frontend = null;
EndpointReference FrontendOrigin() => frontend!.GetEndpoint("http");

// One-shot schema migration (the same `--migrate` command as `bun run migrate` / `compose run backend --migrate`).
var migrate = WithSiteHubSettings(
        builder.AddProject<Projects.APH_SiteHub_Api>("migrate").WithArgs("--migrate"), FrontendOrigin)
    .WaitFor(database);

var backend = WithSiteHubSettings(
        builder.AddProject<Projects.APH_SiteHub_Api>("backend")
            // The API binds to API_PORT itself, so hand it the port Aspire allocated.
            .WithHttpEndpoint(env: "API_PORT"), FrontendOrigin)
    // /health is the database-backed readiness probe the API already exposes.
    .WithHttpHealthCheck("/health")
    .WaitForCompletion(migrate);

var web = builder.AddJavaScriptApp("frontend", "../APH.SiteHub.Ui", "dev").WithBun();
web = string.IsNullOrWhiteSpace(lanHost)
    ? web.WithHttpEndpoint(env: "SITEHUB_DEV_PORT")
    : web.WithHttpEndpoint(port: lanPort, targetPort: lanPort, env: "SITEHUB_DEV_PORT", isProxied: false)
        // Lets `next dev` serve dev assets and HMR to this hostname (see next.config.ts).
        .WithEnvironment("SITEHUB_LAN_HOST", lanHost);
frontend = web
    .WithExternalHttpEndpoints()
    // next.config.ts proxies /api and /health to this target.
    .WithEnvironment("SITEHUB_DEV_API_TARGET", backend.GetEndpoint("http"))
    .WithHttpHealthCheck("/health")
    .WaitFor(backend);

builder.Build().Run();
