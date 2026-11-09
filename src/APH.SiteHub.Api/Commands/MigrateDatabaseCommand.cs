using APH.SiteHub.Application;
using APH.SiteHub.Infrastructure.Persistence;
namespace APH.SiteHub.Api.Commands;

public static class MigrateDatabaseCommand
{
    public static async Task<Result> RunAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var migrator = scope.ServiceProvider.GetRequiredService<DatabaseMigrator>();
        return await scope.ServiceProvider.GetRequiredService<DatabaseOperation>().ExecuteAsync<bool>(async () =>
        {
            var applied = await migrator.MigrateAsync(CancellationToken.None);
            Console.WriteLine(applied == 0 ? "Database schema is up to date." : $"Applied {applied} migration(s).");
            return Result<bool>.Success(true);
        }, CancellationToken.None);
    }
}
