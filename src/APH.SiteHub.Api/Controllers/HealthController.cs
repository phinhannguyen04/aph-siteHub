using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace APH.SiteHub.Api.Controllers;

[ApiController]
public sealed class HealthController : ControllerBase
{
    [HttpGet("/health")]
    public async Task<IActionResult> Get([FromServices] DbSession session, [FromServices] DatabaseOperation database, CancellationToken ct)
    {
        var result = await database.ExecuteAsync<bool>(
            async () => Result<bool>.Success(await session.PingAsync(ct)),
            ct
        );
        return result.IsSuccess && result.Value
            ? Ok(new { status = "ok" })
            : new Error("DATABASE_UNAVAILABLE", "Unable to connect to the database", ErrorType.Unavailable).ToActionResult();
    }
}
