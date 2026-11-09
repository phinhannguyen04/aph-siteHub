using APH.SiteHub.Application;
using APH.SiteHub.Application.Abstractions;
using APH.SiteHub.Domain;
using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class CredentialRepository(
    DbSession session,
    SiteHubOptions options,
    DatabaseOperation database
) : ICredentialRepository
{
    private const string Select = "SELECT id, password_hash, version FROM admin_credentials WHERE id = 'primary'";

    public Task<Result<AdminCredential>> CurrentAsync(CancellationToken ct) => database.ExecuteAsync<AdminCredential>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        var current = await connection.QuerySingleOrDefaultAsync<AdminCredential>(Sql.Command(Select, null, null, ct));
        if (current is not null)
        {
            return Result<AdminCredential>.Success(current);
        }
        if (string.IsNullOrWhiteSpace(options.AdminPasswordHash))
        {
            return Result<AdminCredential>.Failure(Error.Configuration("Initialize administrator credentials using the reset-password command"));
        }
        // MERGE makes concurrent first logins race-safe: the loser inserts nothing and reads the winner's row.
        await connection.ExecuteAsync(Sql.Command(
            "MERGE INTO admin_credentials c USING dual ON (c.id = 'primary') WHEN NOT MATCHED THEN INSERT (id, password_hash, version) VALUES ('primary', :hash, :version)",
            new { hash = options.AdminPasswordHash, version = Guid.NewGuid().ToString() },
            null,
            ct
        ));
        return Result<AdminCredential>.Success(await connection.QuerySingleAsync<AdminCredential>(Sql.Command(Select, null, null, ct)));

    }, ct);
    public Task<Result<AdminCredential?>> ReplaceAsync(
        string passwordHash,
        string expectedVersion,
        CancellationToken ct
    ) => database.ExecuteAsync<AdminCredential?>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        var version = Guid.NewGuid().ToString();
        var affected = await connection.ExecuteAsync(Sql.Command(
            "UPDATE admin_credentials SET password_hash = :hash, version = :version WHERE id = 'primary' AND version = :expected",
            new { hash = passwordHash, version, expected = expectedVersion },
            null,
            ct
        ));
        return Result<AdminCredential?>.Success(affected == 0 ? null : new AdminCredential { PasswordHash = passwordHash, Version = version });

    }, ct);
    public Task<Result<bool>> ForceSetAsync(string passwordHash, CancellationToken ct) => database.ExecuteAsync<bool>(async () =>
    {
        var connection = await session.OpenAsync(ct);
        await connection.ExecuteAsync(Sql.Command(
            """
            MERGE INTO admin_credentials c USING dual ON (c.id = 'primary')
            WHEN MATCHED THEN UPDATE SET c.password_hash = :hash, c.version = :version
            WHEN NOT MATCHED THEN INSERT (id, password_hash, version) VALUES ('primary', :hash, :version)
            """,
            new { hash = passwordHash, version = Guid.NewGuid().ToString() },
            null,
            ct
        ));
        return Result<bool>.Success(true);

    }, ct);
}
