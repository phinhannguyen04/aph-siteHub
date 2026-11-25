using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class DatabaseMigrator(DbSession session)
{
    /// <summary>Applies pending steps in order and records each one. Safe to run repeatedly.</summary>
    public async Task<int> MigrateAsync(CancellationToken ct)
    {
        var connection = await session.OpenAsync(ct);
        await connection.ExecuteAsync(Sql.Command(
            "CREATE TABLE IF NOT EXISTS schema_migrations (id varchar(200) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
            null,
            null,
            ct
        ));
        var applied = (await connection.QueryAsync<string>(Sql.Command("SELECT id FROM schema_migrations", null, null, ct))).ToHashSet();
        var count = 0;
        foreach (var (id, statements) in SchemaMigrations.All.Where(m => !applied.Contains(m.Id)))
        {
            await using var tx = await connection.BeginTransactionAsync(ct);
            foreach (var statement in statements)
            {
                await connection.ExecuteAsync(Sql.Command(statement, null, tx, ct));
            }
            await connection.ExecuteAsync(Sql.Command("INSERT INTO schema_migrations (id) VALUES (@id)", new { id }, tx, ct));
            await tx.CommitAsync(ct);
            count++;
        }
        return count;
    }

    public async Task<int> PendingAsync(CancellationToken ct)
    {
        var connection = await session.OpenAsync(ct);
        var exists = await connection.ExecuteScalarAsync<bool>(Sql.Command("SELECT to_regclass('schema_migrations') IS NOT NULL", null, null, ct));
        if (!exists)
        {
            return SchemaMigrations.All.Count;
        }
        var applied = (await connection.QueryAsync<string>(Sql.Command("SELECT id FROM schema_migrations", null, null, ct))).ToHashSet();
        return SchemaMigrations.All.Count(m => !applied.Contains(m.Id));
    }
}
