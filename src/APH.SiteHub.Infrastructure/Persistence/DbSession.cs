using Npgsql;
namespace APH.SiteHub.Infrastructure.Persistence;

/// <summary>One lazily opened PostgreSQL connection per request/scope (pooled by Npgsql).</summary>
public sealed class DbSession(SiteHubOptions options) : IAsyncDisposable
{
    private NpgsqlConnection? connection;
    public async Task<NpgsqlConnection> OpenAsync(CancellationToken ct)
    {
        connection ??= new NpgsqlConnection(options.ConnectionString);
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }
        return connection;
    }
    public async Task<bool> PingAsync(CancellationToken ct)
    {
        var open = await OpenAsync(ct);
        await using var command = open.CreateCommand();
        command.CommandText = "SELECT 1";
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct)) == 1;
    }
    public ValueTask DisposeAsync() => connection is null ? ValueTask.CompletedTask : connection.DisposeAsync();
}
