using Dapper;
namespace APH.SiteHub.Infrastructure.Persistence;

public sealed class DatabaseMigrator(DbSession session)
{
    /// <summary>Applies pending steps in order and records each one. Safe to run repeatedly.</summary>
    public async Task<int> MigrateAsync(CancellationToken ct)
    {
        var connection = await session.OpenAsync(ct);
        await connection.ExecuteAsync(Sql.Command(
            "CREATE TABLE IF NOT EXISTS schema_migrations (id VARCHAR2(200) NOT NULL, applied_at TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL, CONSTRAINT schema_migrations_pk PRIMARY KEY (id))",
            null,
            null,
            ct
        ));
        var applied = (await connection.QueryAsync<string>(Sql.Command("SELECT id FROM schema_migrations", null, null, ct))).ToHashSet();
        var count = 0;
        foreach (var (id, statements) in SchemaMigrations.All.Where(m => !applied.Contains(m.Id)))
        {
            foreach (var statement in statements)
            {
                await connection.ExecuteAsync(Sql.Command(statement, null, null, ct));
            }
            await connection.ExecuteAsync(Sql.Command("INSERT INTO schema_migrations (id) VALUES (:id)", new { id }, null, ct));
            count++;
        }
        return count;
    }

    public async Task<int> PendingAsync(CancellationToken ct)
    {
        var connection = await session.OpenAsync(ct);
        var exists = await connection.ExecuteScalarAsync<int>(Sql.Command("SELECT COUNT(*) FROM user_tables WHERE table_name = 'SCHEMA_MIGRATIONS'", null, null, ct));
        if (exists == 0)
        {
            return SchemaMigrations.All.Count;
        }
        var applied = (await connection.QueryAsync<string>(Sql.Command("SELECT id FROM schema_migrations", null, null, ct))).ToHashSet();
        return SchemaMigrations.All.Count(m => !applied.Contains(m.Id));
    }
}
