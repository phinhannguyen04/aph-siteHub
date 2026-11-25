using APH.SiteHub.Api.Contracts;
using APH.SiteHub.Api.Http;
using APH.SiteHub.Application.Accounts;
using Microsoft.AspNetCore.Mvc;

namespace APH.SiteHub.Api.Controllers;

[ApiController]
[Route("api/accounts")]
public sealed class AccountsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromServices] ListAccountsHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(), ct)).ToActionResult(accounts => new { accounts });

    [HttpGet("stats")]
    public async Task<IActionResult> Stats([FromServices] AccountStatsHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(), ct)).ToActionResult(stats => new { stats });

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromServices] GetAccountHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(id), ct)).ToActionResult(account => new { account });

    [HttpPost]
    public async Task<IActionResult> Create([FromServices] CreateAccountHandler handler, CancellationToken ct) =>
        (await (await RequestBody.ReadAsync(
            Request,
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
        )).BindAsync(body => handler.HandleAsync(
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
        ))).ToActionResult(account => new { account }, 201);

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromServices] UpdateAccountHandler handler, CancellationToken ct) =>
        (await (await RequestBody.ReadAsync(
            Request,
            ct,
            [
                new("password"),
                new("secret_key"),
                new("is_limit", RequestFieldType.Boolean)
            ]
        )).BindAsync(body => handler.HandleAsync(
            new(id, body.Text("password"), body.Text("secret_key"), body.Boolean("is_limit")),
            ct
        ))).ToActionResult(account => new { account });

    [HttpGet("{id}/secret-key")]
    public async Task<IActionResult> SecretKey(string id, [FromServices] GetAccountSecretHandler handler, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        return (await handler.HandleAsync(new(id), ct)).ToActionResult(secret_key => new { secret_key });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromServices] DeleteAccountHandler handler, CancellationToken ct) =>
        (await handler.HandleAsync(new(id), ct)).ToActionResult(ok => new { ok });
}
