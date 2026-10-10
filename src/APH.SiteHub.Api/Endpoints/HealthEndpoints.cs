using APH.SiteHub.Api.Http;
using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure.Persistence;
namespace APH.SiteHub.Api.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this WebApplication app) => app.MapGet("/health", async (SiteHubDbContext db, DatabaseOperation database, CancellationToken ct) =>
    {
        var result = await database.ExecuteAsync<bool>(async () => Result<bool>.Success(await db.Database.CanConnectAsync(ct)), ct);
        return result.IsSuccess && result.Value ? Results.Ok(new
        {
            status = "ok"
        })
            : ErrorHttpMapper.ToHttpResult(new Error("DATABASE_UNAVAILABLE", "Unable to connect to the database", ErrorType.Unavailable));
    });
}
