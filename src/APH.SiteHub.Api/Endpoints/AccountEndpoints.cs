using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Api.Security;
using APH.SiteHub.Application.Accounts;

namespace APH.SiteHub.Api.Endpoints;

public static class AccountEndpoints
{
    public static void MapAccountEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/accounts")
            .RequireAuthorization()
            .AddEndpointFilter<CsrfFilter>()
            .WithTags("Accounts");
        group.MapGet("", ListAccountsAsync);
        group.MapGet("/stats", GetAccountStatsAsync);
        group.MapGet("/{id}", GetAccountAsync);
        group.MapPost("", CreateAccountAsync);
        group.MapPatch("/{id}", UpdateAccountAsync);
        group.MapGet("/{id}/secret-key", GetAccountSecretAsync);
        group.MapDelete("/{id}", DeleteAccountAsync);
    }

    private static async Task<IResult> ListAccountsAsync(ListAccountsHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(),
                ct
            )
        ).ToHttpResult(accounts => new { accounts });
    }

    private static async Task<IResult> GetAccountStatsAsync(AccountStatsHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(),
                ct
            )
        ).ToHttpResult(stats => new { stats });
    }

    private static async Task<IResult> GetAccountAsync(string id, GetAccountHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(id),
                ct
            )
        ).ToHttpResult(account => new { account });
    }

    private static async Task<IResult> CreateAccountAsync(HttpRequest request, CreateAccountHandler handler, CancellationToken ct)
    {
        return (
            await (
                await RequestBody
                    .ReadAsync(
                        request,
                        ct,
                        [
                            new("provider", Required: true),
                            new("login_name", Required: true),
                            new("external_account_id", Required: true),
                            new("email", Required: true),
                            new("password", Required: true),
                            new("secret_key", Required: true),
                            new("is_limit", RequestFieldType.Boolean),
                            new("created_at", RequestFieldType.DateTime)
                        ]
                    )
            ).BindAsync(
                body => handler.HandleAsync(
                    new(
                        body.Text("provider"),
                        body.Text("login_name"),
                        body.Text("external_account_id"),
                        body.Text("email"),
                        body.Text("password"),
                        body.Text("secret_key"),
                        body.Boolean("is_limit") ?? false,
                        body.Date("created_at")
                    ),
                    ct
                )
            )
        ).ToHttpResult(account => new { account }, 201);
    }

    private static async Task<IResult> UpdateAccountAsync(string id, HttpRequest request, UpdateAccountHandler handler, CancellationToken ct)
    {
        return (
            await (
                await RequestBody.ReadAsync(
                    request,
                    ct,
                    [
                        new("password"),
                        new("secret_key"),
                        new("is_limit", RequestFieldType.Boolean)
                    ]
                )
            ).BindAsync(
                body => handler.HandleAsync(
                    new(
                        id,
                        body.Text("password"),
                        body.Text("secret_key"),
                        body.Boolean("is_limit")
                    ),
                    ct
                )
            )
        ).ToHttpResult(account => new { account });
    }

    private static async Task<IResult> GetAccountSecretAsync(string id, HttpContext http, GetAccountSecretHandler handler, CancellationToken ct)
    {
        http.Response.Headers.CacheControl = "no-store";
        return (
            await handler.HandleAsync(
                new(id),
                ct
            )
        ).ToHttpResult(secret_key => new { secret_key });
    }

    private static async Task<IResult> DeleteAccountAsync(string id, DeleteAccountHandler handler, CancellationToken ct)
    {
        return (
            await handler.HandleAsync(
                new(id),
                ct
            )
        ).ToHttpResult(ok => new { ok });
    }
}
