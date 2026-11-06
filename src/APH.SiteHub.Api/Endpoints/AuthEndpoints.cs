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
        app.MapPost(
            "/api/auth/login",
            async (
                HttpContext http,
                Sessions sessions,
                AuthService auth,
                CancellationToken ct
            ) =>
            {
                if (!sessions.SameOrigin(http.Request))
                {
                    return ErrorHttpMapper.ToHttpResult(
                        Error.Forbidden("Invalid request origin")
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
                    return ErrorHttpMapper.ToHttpResult(login.Error);
                }
                return login.Map(
                    credential => new SessionResponse(
                        sessions.Issue(
                            http.Response,
                            credential.Version
                        )
                    )
                ).ToHttpResult();
            }
        ).RequireRateLimiting(RateLimiting.LoginPolicy)
            .WithTags("Authentication");

        var group = app.MapGroup("/api/auth")
            .RequireAuthorization()
            .AddEndpointFilter<CsrfFilter>()
            .WithTags("Authentication");

        group.MapGet(
            "/session",
            (HttpContext http) => Results.Ok(
                new SessionResponse(
                    http.User.FindFirst("csrf")!.Value
                )
            )
        );

        group.MapPost(
            "/logout",
            (HttpContext http, Sessions sessions) =>
            {
                sessions.Clear(http.Response);
                return Results.Ok(new
                {
                    ok = true
                });
            }
        );

        group.MapPost(
            "/change-password",
            async (
                HttpContext http,
                Sessions sessions,
                AuthService auth,
                CancellationToken ct
            ) => (
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
            ).ToHttpResult()
        );
    }
}
