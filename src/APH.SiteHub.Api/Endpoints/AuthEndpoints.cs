using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application;
using APH.SiteHub.Application.Auth;

namespace APH.SiteHub.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", LoginAsync)
            .WithTags("Authentication");
        var group = app.MapGroup("/api/auth")
            .RequireAuthorization()
            .AddEndpointFilter<CsrfFilter>()
            .WithTags("Authentication");
        group.MapGet("/session", GetSession);
        group.MapPost("/logout", Logout);
        group.MapPost("/change-password", ChangePasswordAsync);
    }

    private static async Task<IResult> LoginAsync(HttpContext http, Sessions sessions, LoginLimiter limiter, AuthService auth, CancellationToken ct)
    {
        if (!sessions.SameOrigin(http.Request))
        {
            return ErrorHttpMapper.ToHttpResult(
                Error.Forbidden("Invalid request origin")
            );
        }
        var key = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (limiter.Blocked(key))
        {
            return ErrorHttpMapper.ToHttpResult(
                new Error(
                    "RATE_LIMITED",
                    "Please try again in 15 minutes",
                    ErrorType.RateLimited
                )
            );
        }
        var login = await (
            await RequestBody.ReadAsync(
                http.Request,
                ct,
                [
                    new("password", Required: true)
                ]
            )
        ).BindAsync(
            body => auth.LoginAsync(
                body.Text("password"),
                ct
            )
        );
        if (login.IsFailure)
        {
            if (login.Error.Type == ErrorType.Unauthorized)
            {
                limiter.Failed(key);
            }
            return ErrorHttpMapper.ToHttpResult(login.Error);
        }
        limiter.Reset(key);
        return login.Map(
            credential => new SessionResponse(
                sessions.Issue(
                    http.Response,
                    credential.Version
                )
            )
        ).ToHttpResult();
    }

    private static IResult GetSession(HttpContext http)
    {
        return Results.Ok(
            new SessionResponse(
                http.User.FindFirst("csrf")!.Value
            )
        );
    }

    private static IResult Logout(HttpContext http, Sessions sessions)
    {
        sessions.Clear(http.Response);
        return Results.Ok(new
        {
            ok = true
        });
    }

    private static async Task<IResult> ChangePasswordAsync(HttpContext http, Sessions sessions, AuthService auth, CancellationToken ct)
    {
        return (
            await (
                await RequestBody.ReadAsync(
                    http.Request,
                    ct,
                    [
                        new("currentPassword", Required: true),
                        new("newPassword", Required: true)
                    ]
                )
            ).BindAsync(
                body => auth.ChangePasswordAsync(
                    body.Text("currentPassword"),
                    body.Text("newPassword"),
                    http.User.FindFirst("version")!.Value,
                    ct
                )
            )
        ).Map(
            credential => new SessionResponse(
                sessions.Issue(
                    http.Response,
                    credential.Version
                )
            )
        ).ToHttpResult();
    }
}
