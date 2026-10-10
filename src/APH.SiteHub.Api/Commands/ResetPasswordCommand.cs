using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Api.Commands;

public static class ResetPasswordCommand
{
    public static async Task<Result> RunAsync(IServiceProvider services)
    {
        var password = Normalize.Password(Console.ReadLine(), 12);
        if (password.IsFailure)
        {
            return password;
        }
        await using var scope = services.CreateAsyncScope();
        var hash = scope.ServiceProvider.GetRequiredService<IPasswordHasher>().Hash(password.Value);
        if (hash.IsFailure)
        {
            return hash;
        }
        var db = scope.ServiceProvider.GetRequiredService<SiteHubDbContext>();
        var version = Guid.NewGuid().ToString();
        var result = await scope.ServiceProvider.GetRequiredService<DatabaseOperation>().ExecuteAsync<bool>(async () =>
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO admin_credentials (id, password_hash, version) VALUES ('primary', {hash.Value}, {version}) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, version = EXCLUDED.version");
            return Result<bool>.Success(true);
        }, CancellationToken.None);
        if (result.IsSuccess)
        {
            Console.WriteLine("Administrator password reset; existing sessions revoked.");
        }
        return result;
    }
}
