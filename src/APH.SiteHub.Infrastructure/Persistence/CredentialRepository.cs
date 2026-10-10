using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
using Microsoft.EntityFrameworkCore;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class CredentialRepository(SiteHubDbContext db, SiteHubOptions options, DatabaseOperation database) : ICredentialRepository
{
    public Task<Result<AdminCredential>> CurrentAsync(CancellationToken ct) => database.ExecuteAsync<AdminCredential>(async () =>
    {
        var current = await db.Credentials.AsNoTracking().SingleOrDefaultAsync(x => x.Id == "primary", ct);
        if (current is not null)
        {
            return Result<AdminCredential>.Success(current);
        }
        if (string.IsNullOrWhiteSpace(options.AdminPasswordHash))
        {
            return Result<AdminCredential>.Failure(Error.Configuration("Initialize administrator credentials using the reset-password command"));
        }
        var version = Guid.NewGuid().ToString();
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO admin_credentials (id, password_hash, version) VALUES ('primary', {options.AdminPasswordHash}, {version}) ON CONFLICT (id) DO NOTHING", ct);
        return Result<AdminCredential>.Success(await db.Credentials.AsNoTracking().SingleAsync(x => x.Id == "primary", ct));

    }, ct);
    public Task<Result<AdminCredential?>> ReplaceAsync(string passwordHash, string expectedVersion, CancellationToken ct) => database.ExecuteAsync<AdminCredential?>(async () =>
    {
        var version = Guid.NewGuid().ToString();
        var affected = await db.Credentials.Where(x => x.Id == "primary" && x.Version == expectedVersion)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.PasswordHash, passwordHash).SetProperty(x => x.Version, version), ct);
        return Result<AdminCredential?>.Success(affected == 0 ? null : new AdminCredential { PasswordHash = passwordHash, Version = version });

    }, ct);
}
