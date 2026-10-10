using System.Text.Json;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure;
using Microsoft.AspNetCore.Authentication;

namespace APH.SiteHub.Api;

public static class DependencyInjection
{
    public static WebApplicationBuilder AddApi(this WebApplicationBuilder builder, SiteHubOptions options)
    {
        builder.WebHost.UseUrls($"http://0.0.0.0:{options.Port}");
        builder.WebHost.ConfigureKestrel(server => server.Limits.MaxRequestBodySize = 1024 * 1024);
        builder.Services.AddApplication().AddInfrastructure(options);
        builder.Services.AddSingleton(TimeProvider.System).AddSingleton<Sessions>().AddSingleton<LoginLimiter>();
        builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>("Session", _ => { });
        builder.Services.AddAuthorization();
        builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy => policy.WithOrigins(options.Origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
        builder.Services.AddExceptionHandler<ApiExceptionHandler>().AddProblemDetails();
        builder.Services.AddOpenApi();
        builder.Services.ConfigureHttpJsonOptions(json =>
        {
            json.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
            json.SerializerOptions.DictionaryKeyPolicy = null;
        });
        builder.Services.Configure<RouteHandlerOptions>(route => route.ThrowOnBadRequest = true);
        return builder;
    }
}
