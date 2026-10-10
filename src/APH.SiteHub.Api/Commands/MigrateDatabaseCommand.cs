using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Api.Commands;

public static class MigrateDatabaseCommand
{
    public static async Task<Result> RunAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SiteHubDbContext>();
        return await scope.ServiceProvider.GetRequiredService<DatabaseOperation>().ExecuteAsync<bool>(async () =>
        {
            await db.Database.MigrateAsync();
            return Result<bool>.Success(true);
        }, CancellationToken.None);
    }
}
